#!/usr/bin/env python
"""Start the web UI:  python scripts/serve.py   ->  http://127.0.0.1:8000"""
import argparse

import uvicorn


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default="127.0.0.1", help="keep 127.0.0.1 unless you understand the exposure")
    ap.add_argument("--port", type=int, default=8000)
    a = ap.parse_args()
    uvicorn.run("dooms.server.app:app", host=a.host, port=a.port, log_level="info")


if __name__ == "__main__":
    main()
