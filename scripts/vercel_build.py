#!/usr/bin/env python
"""Vercel build: copy the static web UI (it includes the in-browser engine) into public/.

The simulator and the agents run in the visitor's browser, so no backend is needed. $DOOMS_API_URL is optional: a Dooms
server it points at is only used for real robots (USB arm + camera), which a hosted page cannot reach.
"""
import os
import shutil
from pathlib import Path

root = Path(__file__).resolve().parent.parent
src = root / "src" / "dooms" / "server" / "static"
out = root / "public"
api = os.environ.get("DOOMS_API_URL", "").rstrip("/")

if not (src / "engine" / "engine.worker.js").exists():
    raise SystemExit("engine bundle missing: run `npm install && npm run build` first")

shutil.rmtree(out, ignore_errors=True)
shutil.copytree(src, out / "static")
shutil.copy(src / "index.html", out / "index.html")
(out / "static" / "config.js").write_text(f'window.DOOMS_API = "{api}";\n')
print(f"built {out}" + (f" (real-robot server: {api})" if api else " (browser engine only)"))
