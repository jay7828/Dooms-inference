#!/usr/bin/env python
"""Sanity-check the Bedrock setup step by step:  python scripts/check_bedrock.py [--model ID]"""
import argparse
import os

from botocore.exceptions import ClientError
import boto3
from pydantic import BaseModel

from dooms.config import load_config, load_env
from dooms.llm.base import Image
from dooms.llm.bedrock_client import BedrockClient


class Pt(BaseModel):
    u: float
    v: float


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default=None)
    a = ap.parse_args()
    load_env()
    cfg = load_config()["bedrock"]
    region = os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or cfg["region"]
    model = a.model or cfg["default_model"]
    print(f"region {region} | model {model}")
    try:
        who = boto3.client("sts", region_name=region).get_caller_identity()["Arn"]
        print("1. credentials ok:", who.split(":")[-1])
    except Exception as e:  # noqa: BLE001
        print("1. credentials FAILED:", e); return
    client = BedrockClient(cfg, model_override=model)
    try:
        client.client.converse(modelId=model, messages=[{"role": "user", "content": [{"text": "Say hi."}]}],
                               inferenceConfig={"maxTokens": 20})
        print("2. plain text call ok")
    except ClientError as e:
        print("2. plain text call FAILED:", e.response["Error"]["Code"], "-", e.response["Error"]["Message"]); return
    # tiny image + forced tool use (exactly what the agents do)
    import cv2, numpy as np
    from dooms.perception.viz import encode_png
    img = np.zeros((120, 160, 3), np.uint8); cv2.circle(img, (110, 40), 12, (255, 60, 60), -1)
    out = client.structured(agent="vision_grounder", system="Point at the red circle. Pixel coordinates.",
                            content=["Where is the red circle? u=x, v=y in pixels (image is 160x120).", Image(encode_png(img))],
                            schema=Pt, max_tokens=100)
    print(f"3. image + tool-use ok: model pointed at ({out.u:.0f}, {out.v:.0f}); truth is (110, 40)")
    print("all good - run scripts/run_task.py --llm bedrock")


if __name__ == "__main__":
    main()
