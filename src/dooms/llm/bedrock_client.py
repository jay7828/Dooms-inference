"""Claude on Amazon Bedrock through the Converse API (text + image blocks, forced tool-use JSON)."""
from __future__ import annotations

import os
import time

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from pydantic import BaseModel

from ..config import load_env
from .base import Block, CallRecord, Image, Usage

TRANSIENT = {"ThrottlingException", "ModelTimeoutException", "ServiceUnavailableException",
             "InternalServerException", "ModelNotReadyException"}


def tool_schema(model: type[BaseModel]) -> dict:
    """Pydantic JSON schema with $refs inlined, titles dropped and Optional[X] collapsed to X.
    Keeps the tool schema simple enough for any Bedrock model to accept."""
    raw = model.model_json_schema()
    defs = raw.get("$defs", {})

    def walk(node):
        if isinstance(node, list):
            return [walk(x) for x in node]
        if not isinstance(node, dict):
            return node
        if "$ref" in node:
            return walk(defs[node["$ref"].split("/")[-1]])
        if "anyOf" in node:
            non_null = [x for x in node["anyOf"] if x.get("type") != "null"]
            if len(non_null) == 1:
                merged = {k: v for k, v in node.items() if k != "anyOf"}
                return walk({**non_null[0], **merged})
        return {k: walk(v) for k, v in node.items() if k not in ("title", "$defs", "default")}

    return walk(raw)


def _session(creds: dict | None, default_region: str):
    """boto3 session from user-provided credentials (never falls back to the server's own keys) or the environment."""
    if creds:
        region = creds.get("region") or default_region
        if creds.get("bearer_token"):                       # Bedrock API key: process-local (one process per session)
            os.environ["AWS_BEARER_TOKEN_BEDROCK"] = creds["bearer_token"]
            return boto3.Session(region_name=region)
        return boto3.Session(aws_access_key_id=creds.get("access_key_id"), aws_secret_access_key=creds.get("secret_access_key"),
                             aws_session_token=creds.get("session_token") or None, region_name=region)
    load_env()
    return boto3.Session(region_name=os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or default_region)


class BedrockClient:
    remote = True        # network calls: the session worker runs them on a helper thread so Stop can interrupt them

    def __init__(self, bedrock_cfg: dict, model_override: str | None = None, credentials: dict | None = None):
        self.cfg = bedrock_cfg
        self.default_model = model_override or bedrock_cfg["default_model"]
        self.client = _session(credentials, bedrock_cfg["region"]).client(
            "bedrock-runtime", config=Config(read_timeout=180, retries={"max_attempts": 2, "mode": "standard"}))
        self.usage = Usage()

    def model_for(self, agent: str) -> str:
        return (self.cfg.get("agents", {}).get(agent, {}) or {}).get("model") or self.default_model

    @staticmethod
    def _blocks(content: list[Block]) -> list[dict]:
        out = []
        for b in content:
            if isinstance(b, Image):
                out.append({"image": {"format": "png", "source": {"bytes": b.png}}})
            else:
                out.append({"text": b})
        return out

    def structured(self, *, agent: str, system: str, content: list[Block], schema: type[BaseModel],
                   max_tokens: int = 2000, temperature: float = 0.0) -> BaseModel:
        model = self.model_for(agent)
        tool = "submit"
        req = dict(
            modelId=model,
            system=[{"text": system}],
            messages=[{"role": "user", "content": self._blocks(content)}],
            inferenceConfig={"maxTokens": max_tokens, "temperature": temperature},
            toolConfig={"tools": [{"toolSpec": {
                "name": tool, "description": "Submit the final structured answer.",
                "inputSchema": {"json": tool_schema(schema)}}}],
                "toolChoice": {"tool": {"name": tool}}},
        )
        retry = self.cfg.get("retry", {"max_attempts": 3, "base_delay_s": 1.5})
        for attempt in range(retry["max_attempts"]):
            t0 = time.time()
            try:
                resp = self.client.converse(**req)
            except ClientError as e:
                code = e.response.get("Error", {}).get("Code", "")
                self.usage.add(CallRecord(agent, model, 0, 0, time.time() - t0, ok=False))
                if code in TRANSIENT and attempt < retry["max_attempts"] - 1:
                    time.sleep(retry["base_delay_s"] * 2 ** attempt)
                    continue
                msg = e.response.get("Error", {}).get("Message", "")
                if "Operation not allowed" in msg:
                    raise RuntimeError(
                        "AWS refused to invoke any Bedrock model for this account ('Operation not allowed'). Your keys are "
                        "valid; this is an account-level restriction, not the model ID. Check AWS Billing (valid payment "
                        "method, no unpaid invoice), open the Bedrock console Playground with the same model to see the "
                        "reason, and check Service Quotas / Organizations SCPs. Then run: python scripts/check_bedrock.py"
                    ) from e
                if code in ("AccessDeniedException",) and "model" in msg.lower():
                    raise RuntimeError(f"Bedrock access denied for model {model}: {msg}. Enable model access in the "
                                       "Bedrock console (or fix the IAM policy) and retry.") from e
                raise
            u = resp.get("usage", {})
            self.usage.add(CallRecord(agent, model, u.get("inputTokens", 0), u.get("outputTokens", 0),
                                      time.time() - t0))
            for block in resp["output"]["message"]["content"]:
                if "toolUse" in block:
                    return schema.model_validate(block["toolUse"]["input"])
            raise ValueError(f"{agent}: model returned no tool call (stopReason={resp.get('stopReason')})")
        raise RuntimeError("unreachable")


# ------------------------------------------------------------------------------------------------ validation
_FRIENDLY = {
    "InvalidClientTokenId": "The access key ID is not valid.",
    "UnrecognizedClientException": "The access key ID or session token is not valid.",
    "SignatureDoesNotMatch": "The secret access key does not match the access key ID.",
    "ExpiredToken": "These temporary credentials have expired.",
    "ExpiredTokenException": "These temporary credentials have expired.",
    "AccessDenied": "The credentials are valid but not allowed to do this. Grant bedrock:InvokeModel (and bedrock:ListInferenceProfiles).",
    "AccessDeniedException": "The credentials are valid but not allowed to do this. Grant bedrock:InvokeModel (and bedrock:ListInferenceProfiles).",
}


def _friendly(e: Exception) -> str:
    if isinstance(e, ClientError):
        code = e.response.get("Error", {}).get("Code", "")
        msg = e.response.get("Error", {}).get("Message", "")
        if "Operation not allowed" in msg:
            return ("AWS refused model invocation for this account (\'Operation not allowed\'). Check billing / payment method and "
                    "Bedrock model access in the AWS console.")
        if code in _FRIENDLY:
            return _FRIENDLY[code]
        return f"{code or 'AWS error'}: {msg[:200]}"
    return f"{type(e).__name__}: {str(e)[:200]}"


def _pick_default(models: list[str]) -> str | None:
    for pref in ("claude-sonnet-4-5", "claude-sonnet-5", "claude-sonnet-4-6", "claude-haiku-4-5", "claude-opus"):
        for m in models:
            if pref in m and m.startswith(("us.", "global.", "eu.", "apac.")):
                return m
    return models[0] if models else None


def validate_credentials(creds: dict, test_model: str | None = None) -> dict:
    """Check user-provided credentials without touching the process environment. Never echoes secrets."""
    import json as _json
    import urllib.error
    import urllib.request

    region = (creds.get("region") or "us-east-1").strip()
    out: dict = {"ok": False, "region": region, "models": []}
    try:
        if creds.get("bearer_token"):                          # Bedrock API key: plain HTTPS call, no environment changes
            model = test_model or "us.anthropic.claude-sonnet-4-5-20250929-v1:0"
            req = urllib.request.Request(
                f"https://bedrock-runtime.{region}.amazonaws.com/model/{model}/converse",
                data=_json.dumps({"messages": [{"role": "user", "content": [{"text": "hi"}]}],
                                  "inferenceConfig": {"maxTokens": 5}}).encode(),
                headers={"Authorization": f"Bearer {creds['bearer_token']}", "Content-Type": "application/json"})
            try:
                urllib.request.urlopen(req, timeout=30).read()
            except urllib.error.HTTPError as e:
                body = e.read().decode("utf-8", "ignore")
                if "Operation not allowed" in body:
                    out["message"] = "AWS refused model invocation for this account ('Operation not allowed')."
                elif e.code in (401, 403):
                    out["message"] = "The Bedrock API key was rejected."
                else:
                    out["message"] = f"Bedrock returned HTTP {e.code}."
                return out
            out.update(ok=True, tested_model=model, models=[model], identity="Bedrock API key", message="Connected.")
            return out
        session = boto3.Session(aws_access_key_id=creds.get("access_key_id", "").strip(),
                                aws_secret_access_key=creds.get("secret_access_key", "").strip(),
                                aws_session_token=(creds.get("session_token") or "").strip() or None, region_name=region)
        ident = session.client("sts").get_caller_identity()
        out.update(account=ident["Account"], arn=ident["Arn"], identity=ident["Arn"].split(":")[-1])
        try:
            profs = session.client("bedrock").list_inference_profiles(maxResults=100)["inferenceProfileSummaries"]
            out["models"] = sorted(p["inferenceProfileId"] for p in profs if "anthropic.claude" in p["inferenceProfileId"])
        except ClientError:
            out["models"] = []
        model = test_model or _pick_default(out["models"]) or "us.anthropic.claude-sonnet-4-5-20250929-v1:0"
        if model not in out["models"]:
            out["models"].append(model)
        session.client("bedrock-runtime").converse(modelId=model, messages=[{"role": "user", "content": [{"text": "hi"}]}],
                                                  inferenceConfig={"maxTokens": 5})
        out.update(ok=True, tested_model=model, message="Connected.")
    except Exception as e:  # noqa: BLE001
        out["message"] = _friendly(e)
    return out
