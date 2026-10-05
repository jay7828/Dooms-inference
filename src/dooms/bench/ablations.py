"""Named config patches for the benchmark's ablation study."""
ABLATIONS: dict[str, dict] = {
    "baseline": {},
    "oracle_grounding": {"pipeline": {"grounding": "oracle"}},
    "no_wrist_refine": {"pipeline": {"wrist_refine": False}},
    "no_refine": {"pipeline": {"refine_iters": 0}},
    "no_skill_library": {"pipeline": {"skill_library_dir": "__off__"}},
    "no_regrounding": {"pipeline": {"max_regrounds": 0}},
    "no_retry": {"pipeline": {"max_subtask_retries": 0, "max_replans": 0, "max_regrounds": 0}},
    "no_decomposer": {"pipeline": {"use_decomposer": False}},
    "jev_shadow": {"pipeline": {"advisor": "shadow"}},        # rules decide, Jev's answers are recorded beside them
    "jev_monitor": {"pipeline": {"advisor": "monitor"}},
    "jev_recovery": {"pipeline": {"advisor": "recovery"}},
    "jev_both": {"pipeline": {"advisor": "both"}},
}
