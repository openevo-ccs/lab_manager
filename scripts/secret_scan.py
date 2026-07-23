#!/usr/bin/env python3
"""Scan every repo's TRACKED files for credential-shaped filenames.

Formalizes the one-off manual scan from
docs/design-notes/ecosystem-cleanliness-and-maintenance-plan.md §2/§5 into a
repeatable Tier 0 check. Filename patterns only — deliberately does not read
file contents (content-scanning for secrets is a much noisier, slower,
higher-false-positive problem; the filename check already caught the one
real hit that existed in this ecosystem, and stays fast enough to run every
time). Never modifies anything — flags for human review only.

Usage:
    python scripts/secret_scan.py
    python scripts/secret_scan.py --root D:\\dev\\openevo-ccs
"""
from __future__ import annotations

import argparse
import re
import subprocess
from pathlib import Path

LAB_ROOT = Path(__file__).resolve().parents[2]

# This tool's own name contains "secret" — exclude it explicitly rather than
# tighten the patterns generally and risk missing a real hit. Found live:
# the first real run flagged itself.
SELF_EXCLUDE = {("lab_manager", "scripts/secret_scan.py")}

PATTERNS = [
    re.compile(r"\.env($|\.)", re.IGNORECASE),
    re.compile(r"_key\b", re.IGNORECASE),
    re.compile(r"secret", re.IGNORECASE),
    re.compile(r"credential", re.IGNORECASE),
    re.compile(r"\.pem$", re.IGNORECASE),
    re.compile(r"\.pfx$", re.IGNORECASE),
]


def tracked_files(repo: Path) -> list[str]:
    result = subprocess.run(["git", "ls-files"], cwd=repo, capture_output=True, text=True)
    return result.stdout.splitlines()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=LAB_ROOT)
    args = parser.parse_args()

    hits: dict[str, list[str]] = {}
    for entry in sorted(args.root.iterdir()):
        if not entry.is_dir() or entry.name.startswith("."):
            continue
        if not (entry / ".git").exists():
            continue
        matches = [
            f
            for f in tracked_files(entry)
            if any(p.search(f) for p in PATTERNS) and (entry.name, f) not in SELF_EXCLUDE
        ]
        if matches:
            hits[entry.name] = matches

    if not hits:
        print("Clean: no credential-shaped filenames found in any tracked file, across all repos.")
        return 0

    print(f"Found {sum(len(v) for v in hits.values())} credential-shaped filename(s) — READ EACH ONE, don't assume:")
    for repo, files in hits.items():
        for f in files:
            print(f"  {repo}/{f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
