#!/usr/bin/env python
"""Vercel build: copy the static web UI into public/ and point it at the backend in $DOOMS_API_URL."""
import os
import shutil
from pathlib import Path

root = Path(__file__).resolve().parent.parent
src = root / "src" / "dooms" / "server" / "static"
out = root / "public"
api = os.environ.get("DOOMS_API_URL", "").rstrip("/")
if not api:
    raise SystemExit("DOOMS_API_URL is not set (e.g. https://dooms-backend.onrender.com)")

shutil.rmtree(out, ignore_errors=True)
shutil.copytree(src, out / "static")
shutil.copy(src / "index.html", out / "index.html")
(out / "static" / "config.js").write_text(f'window.DOOMS_API = "{api}";\n')
print(f"built {out} -> backend {api}")
