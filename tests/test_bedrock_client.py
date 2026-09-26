import json

from dooms.config import load_config
from dooms.llm.base import Image
from dooms.llm.bedrock_client import BedrockClient, tool_schema
from dooms.llm.schemas import Decomposition, SkillRecipes


class FakeBedrock:
    def __init__(self):
        self.requests = []

    def converse(self, **req):
        self.requests.append(req)
        payload = {"subtasks": [{"id": 1, "name": "Approach", "description": "d"},
                                {"id": 2, "name": "Grasp", "description": "d"}]}
        return {"output": {"message": {"content": [{"toolUse": {"name": "submit", "input": payload}}]}},
                "usage": {"inputTokens": 1200, "outputTokens": 80}, "stopReason": "tool_use"}


def test_converse_request_shape_and_parsing(monkeypatch):
    monkeypatch.setenv("AWS_REGION", "us-east-1")
    client = BedrockClient(load_config()["bedrock"])
    client.client = FakeBedrock()
    out = client.structured(agent="task_decomposer", system="sys", content=["hello", Image(b"\x89PNG")],
                            schema=Decomposition, max_tokens=500)
    assert [s.name for s in out.subtasks] == ["Approach", "Grasp"]
    req = client.client.requests[0]
    assert req["modelId"].startswith("us.anthropic.claude-sonnet-4-5")
    assert req["toolConfig"]["toolChoice"] == {"tool": {"name": "submit"}}
    blocks = req["messages"][0]["content"]
    assert blocks[0] == {"text": "hello"} and blocks[1]["image"]["format"] == "png"
    assert client.usage.input_tokens == 1200 and client.usage.output_tokens == 80


def test_tool_schema_is_flat():
    schema = tool_schema(SkillRecipes)
    text = json.dumps(schema)
    assert "$ref" not in text and "$defs" not in text and "anyOf" not in text


def test_user_credentials_are_used_explicitly_and_never_echoed(monkeypatch):
    import boto3
    captured = {}

    class FakeSession:
        def __init__(self, **kw):
            captured.update(kw)

        def client(self, name, **kw):
            captured["service"] = name
            return object()

    monkeypatch.setattr(boto3, "Session", FakeSession)
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "SERVER_KEY_MUST_NOT_BE_USED")
    creds = {"access_key_id": "AKIAUSER", "secret_access_key": "usersecret", "session_token": "tok", "region": "eu-west-1"}
    client = BedrockClient(load_config()["bedrock"], credentials=creds)
    assert captured["aws_access_key_id"] == "AKIAUSER" and captured["region_name"] == "eu-west-1"
    assert captured["aws_session_token"] == "tok" and captured["service"] == "bedrock-runtime"
    assert client.default_model.startswith("us.anthropic")


def test_validate_endpoint_hides_secrets_and_reports_friendly_errors(monkeypatch):
    from fastapi.testclient import TestClient
    import dooms.llm.bedrock_client as bc
    from dooms.server.app import app

    def fake_validate(creds, model=None):
        assert creds["secret_access_key"] == "s3cr3t-value"
        return {"ok": False, "message": bc._FRIENDLY["SignatureDoesNotMatch"]}

    monkeypatch.setattr(bc, "validate_credentials", fake_validate)
    r = TestClient(app).post("/api/bedrock/validate", json={"credentials": {"access_key_id": "AKIA1", "secret_access_key": "s3cr3t-value", "region": "us-east-1"}})
    assert r.status_code == 200 and "s3cr3t-value" not in r.text and "does not match" in r.json()["message"]
    assert TestClient(app).post("/api/bedrock/validate", json={"credentials": {}}).status_code == 400
