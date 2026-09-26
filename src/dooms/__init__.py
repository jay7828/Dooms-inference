"""Dooms: agentic task-axis manipulation in simulation."""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]          # code + configs (may be read-only when bundled)
CONFIG_DIR = ROOT / "configs"
DATA_DIR = Path(os.environ.get("DOOMS_HOME") or ROOT)   # writable: skills, run artefacts, .env
