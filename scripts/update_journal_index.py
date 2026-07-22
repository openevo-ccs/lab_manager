#!/usr/bin/env python3
"""Refresh reports/journal/index.json after adding/editing a journal entry.

Same manifest pattern git_health.py already uses for reports/daily/ — static
Pages hosting has no directory listing, so the dashboard needs this to know
which entries exist. Run after writing or editing any reports/journal/*.json.
"""
import json
from pathlib import Path

JOURNAL_DIR = Path(__file__).resolve().parents[1] / "reports" / "journal"


def main() -> int:
    dates = sorted(p.stem for p in JOURNAL_DIR.glob("*.json") if p.stem != "index")
    manifest = {"available": dates, "latest": dates[-1] if dates else None, "count": len(dates)}
    (JOURNAL_DIR / "index.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"reports/journal/index.json: {len(dates)} entries, latest {manifest['latest']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
