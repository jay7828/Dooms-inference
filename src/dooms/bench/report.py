"""Write summary.csv / summary.md / success-rate plot from episodes.jsonl."""
from __future__ import annotations

import csv
import json
from pathlib import Path

from .metrics import aggregate


def load_episodes(path: Path) -> list[dict]:
    return [json.loads(l) for l in Path(path).read_text().splitlines() if l.strip()]


def write_report(out_dir: Path) -> list[dict]:
    out_dir = Path(out_dir)
    rows = aggregate(load_episodes(out_dir / "episodes.jsonl"))
    if not rows:
        return rows
    with open(out_dir / "summary.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    lines = ["| variant | task | n | success (95% CI) | subtasks | LLM calls | tokens in/out | cost $ | LLM s | Jev calls / s / $ | Jev agrees | sim s | ground err mm |",
             "|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
    for r in rows:
        lines.append(f"| {r['variant']} | {r['task']} | {r['episodes']} | {r['success_rate']:.0%} "
                     f"({r['ci_low']:.0%}-{r['ci_high']:.0%}) | {r['subtask_success']:.0%} | {r['llm_calls']:.1f} | "
                     f"{r['input_tokens']:.0f}/{r['output_tokens']:.0f} | {r['cost_usd']:.3f} | {r['llm_latency_s']:.1f} | "
                     f"{r['jev_calls']:.1f} / {r['jev_latency_s']:.2f} / {r['jev_cost_usd']:.5f} | "
                     f"{r['shadow_agreement']:.0%} | {r['sim_s']:.0f} | {r['grounding_err_mm']:.1f} |")
    (out_dir / "summary.md").write_text("\n".join(lines) + "\n")
    _plot(rows, out_dir / "success_rate.png")
    return rows


def _plot(rows, path: Path) -> None:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import numpy as np
    variants = sorted({r["variant"] for r in rows})
    tasks = sorted({r["task"] for r in rows})
    fig, ax = plt.subplots(figsize=(1.6 * len(tasks) * max(1, len(variants) / 2) + 3, 4))
    w = 0.8 / len(variants)
    for i, v in enumerate(variants):
        xs, ys, lo, hi = [], [], [], []
        for j, t in enumerate(tasks):
            r = next((r for r in rows if r["variant"] == v and r["task"] == t), None)
            if r:
                xs.append(j + i * w)
                ys.append(r["success_rate"])
                lo.append(r["success_rate"] - r["ci_low"])
                hi.append(r["ci_high"] - r["success_rate"])
        ax.bar(xs, ys, w, yerr=[lo, hi], capsize=3, label=v)
    ax.set_xticks(np.arange(len(tasks)) + w * (len(variants) - 1) / 2)
    ax.set_xticklabels(tasks, rotation=15)
    ax.set_ylim(0, 1.05)
    ax.set_ylabel("success rate")
    ax.legend(fontsize=8)
    fig.tight_layout()
    fig.savefig(path, dpi=150)
    plt.close(fig)
