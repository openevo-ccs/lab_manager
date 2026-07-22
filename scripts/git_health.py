#!/usr/bin/env python3
"""Ecosystem-wide git health check.

Phase 2 of docs/design-notes/ecosystem-dashboard-and-health-monitoring-plan.md §5.
Extends the repo root's check_repos.py: same checks (branch, clean/dirty, ahead/behind,
remote, expected files), plus JSON output, GitHub-org attribution (this ecosystem spans
both github.com/openevo-ccs and github.com/openevo-ccs-lab), actual default-branch
detection instead of an assumed "main", and optional open issue/PR counts via the
GitHub API.

Tier 1 per the design doc: no GWDG calls, safe to run in CI or locally, output is public
by construction (repo/git metadata, nothing sensitive) and defaults to landing directly
in the committed reports/daily/ tree.

Usage:
    python scripts/git_health.py                  # scan, write reports/daily/<date>.json
    python scripts/git_health.py --output -        # write to stdout instead
    python scripts/git_health.py --root D:\\dev\\openevo-ccs   # override lab root

Stdlib only — no dependencies to install.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

REQUIRED_FILES = ["README.md", "LICENSE"]
RECOMMENDED_FILES = [".gitignore", "CONTRIBUTING.md"]
EXPECTED_FILES = REQUIRED_FILES + RECOMMENDED_FILES
EXPECTED_CI_DIR = ".github/workflows"

# Computed relative to this file's own location (scripts/ -> lab_manager -> lab root),
# not hardcoded — the whole point of Phase 2 is to survive the pending D:\dev rename
# without needing another one-line fix like check_repos.py and schema_generator.py did.
DEFAULT_LAB_ROOT = Path(__file__).resolve().parents[2]


def run(cmd: list[str], cwd: Path) -> tuple[str, int]:
    import subprocess

    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    return result.stdout.strip(), result.returncode


def org_repo_from_remote(url: str) -> tuple[str | None, str | None]:
    """Extract (org, repo) from a GitHub remote URL, https or ssh form."""
    if not url:
        return None, None
    # Repo names can contain dots themselves (e.g. w3id.org) — only strip a trailing
    # ".git" suffix specifically, don't exclude dots from the repo-name class generally.
    match = re.search(r"github\.com[:/]([^/]+)/(.+?)(?:\.git)?$", url.strip())
    if not match:
        return None, None
    return match.group(1), match.group(2)


def get_default_branch(path: Path) -> str | None:
    out, rc = run(["git", "symbolic-ref", "--short", "refs/remotes/origin/HEAD"], path)
    if rc == 0 and out:
        return out.rsplit("/", 1)[-1]
    return None


def days_since(iso_date: str) -> int | None:
    if not iso_date:
        return None
    try:
        dt = datetime.fromisoformat(iso_date)
        return (datetime.now(timezone.utc) - dt).days
    except ValueError:
        return None


def github_open_counts(org: str, repo: str, token: str | None) -> dict | None:
    """Open issue+PR count via the GitHub API. Returns None if the call fails —
    this is a nice-to-have, not something that should fail the whole health check."""
    req = urllib.request.Request(
        f"https://api.github.com/repos/{org}/{repo}",
        headers={
            "Accept": "application/vnd.github+json",
            **({"Authorization": f"Bearer {token}"} if token else {}),
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.load(resp)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError):
        return None
    # GitHub's REST API counts issues+PRs together in open_issues_count.
    return {
        "open_issues_and_prs": data.get("open_issues_count"),
        "default_branch_reported": data.get("default_branch"),
        "archived": data.get("archived"),
    }


def load_local_env(lab_manager_root: Path) -> dict[str, str]:
    """Minimal .env loader for local/.env — stdlib only, no python-dotenv dependency."""
    env_path = lab_manager_root / "local" / ".env"
    values: dict[str, str] = {}
    if not env_path.exists():
        return values
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        values[key.strip()] = value.strip()
    return values


def check_repo(path: Path, github_token: str | None, use_github_api: bool) -> dict:
    result: dict = {"name": path.name}

    if not (path / ".git").exists():
        result["is_git_repo"] = False
        return result
    result["is_git_repo"] = True

    branch, _ = run(["git", "rev-parse", "--abbrev-ref", "HEAD"], path)
    result["current_branch"] = branch or None

    status, _ = run(["git", "status", "--porcelain"], path)
    result["clean"] = status == ""
    result["uncommitted_change_count"] = len(status.splitlines()) if status else 0

    remote, _ = run(["git", "remote", "get-url", "origin"], path)
    org, repo = org_repo_from_remote(remote)
    result["remote"] = remote or None
    result["github_org"] = org
    result["github_repo"] = repo

    run(["git", "fetch", "--quiet"], path)
    default_branch = get_default_branch(path)
    result["default_branch"] = default_branch

    if default_branch:
        counts, rc = run(
            ["git", "rev-list", "--left-right", "--count", f"origin/{default_branch}...HEAD"],
            path,
        )
        if rc == 0 and counts:
            behind, ahead = counts.split()
            result["ahead"] = int(ahead)
            result["behind"] = int(behind)
        else:
            result["ahead"] = result["behind"] = None
    else:
        result["ahead"] = result["behind"] = None
        result["note"] = "no origin/HEAD symbolic-ref — default branch unknown, ahead/behind not computed"

    last_commit_iso, _ = run(["git", "log", "-1", "--format=%cI"], path)
    result["last_commit_at"] = last_commit_iso or None
    result["days_since_last_commit"] = days_since(last_commit_iso)

    result["files"] = {fname: (path / fname).exists() for fname in EXPECTED_FILES}
    result["has_ci_workflow"] = (path / EXPECTED_CI_DIR).is_dir() and any(
        (path / EXPECTED_CI_DIR).iterdir()
    ) if (path / EXPECTED_CI_DIR).is_dir() else False

    if use_github_api and org and repo:
        gh = github_open_counts(org, repo, github_token)
        result["github_api"] = gh
    else:
        result["github_api"] = None

    result["missing_required_files"] = [f for f in REQUIRED_FILES if not result["files"].get(f)]
    result["missing_recommended_files"] = [f for f in RECOMMENDED_FILES if not result["files"].get(f)]
    result["status"] = compute_status(result)

    return result


def compute_status(r: dict) -> str:
    """One of good/warning/serious/critical — a single deterministic signal for the
    dashboard's stat tiles and status dots. Missing CONTRIBUTING.md/.gitignore alone
    doesn't demote a repo (nearly every repo in this ecosystem lacks one today, so
    treating it as more than informational would swamp the signal) — required-file
    gaps, sync state, and CI presence are what actually move the needle."""
    ahead, behind = r.get("ahead") or 0, r.get("behind") or 0
    if ahead and behind:
        return "critical"  # diverged from its own remote
    if behind:
        return "serious"  # remote has commits this clone hasn't pulled
    if (
        not r.get("clean", True)
        or ahead
        or r.get("missing_required_files")
        or not r.get("has_ci_workflow")
    ):
        return "warning"
    return "good"


def scan(lab_root: Path, github_token: str | None, use_github_api: bool) -> dict:
    repos = []
    for entry in sorted(lab_root.iterdir()):
        if not entry.is_dir() or entry.name.startswith("."):
            continue
        if not (entry / ".git").exists():
            continue
        repos.append(check_repo(entry, github_token, use_github_api))

    by_org: dict[str, int] = {}
    by_status: dict[str, int] = {"good": 0, "warning": 0, "serious": 0, "critical": 0}
    for r in repos:
        org = r.get("github_org") or "unknown"
        by_org[org] = by_org.get(org, 0) + 1
        by_status[r.get("status", "good")] = by_status.get(r.get("status", "good"), 0) + 1

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "lab_root": str(lab_root),
        "repo_count": len(repos),
        "repos_by_org": by_org,
        "repos_by_status": by_status,
        "repos": repos,
    }


def update_index(reports_dir: Path) -> None:
    """Write reports_dir/index.json — a manifest of available dated reports, since
    static GitHub Pages hosting has no directory listing for the dashboard to query."""
    dates = sorted(
        p.stem for p in reports_dir.glob("*.json") if p.stem != "index" and p.stem != "latest"
    )
    manifest = {"available": dates, "latest": dates[-1] if dates else None}
    (reports_dir / "index.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root", type=Path, default=DEFAULT_LAB_ROOT, help="Lab root to scan (default: computed from script location)"
    )
    parser.add_argument(
        "--output", default=None, help="Output path, or '-' for stdout (default: reports/daily/<date>.json)"
    )
    parser.add_argument(
        "--no-github-api", action="store_true", help="Skip GitHub API calls (git-only, fully offline)"
    )
    args = parser.parse_args()

    lab_manager_root = Path(__file__).resolve().parents[1]
    env = load_local_env(lab_manager_root)
    github_token = os.environ.get("GITHUB_TOKEN") or env.get("GITHUB_TOKEN")

    report = scan(args.root, github_token, use_github_api=not args.no_github_api)

    if args.output == "-":
        print(json.dumps(report, indent=2))
        return 0

    if args.output:
        out_path = Path(args.output)
    else:
        date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        out_path = lab_manager_root / "reports" / "daily" / f"{date_str}.json"

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    if args.output in (None, "") :
        update_index(out_path.parent)

    print(f"Wrote {out_path} - {report['repo_count']} repos, by org: {report['repos_by_org']}, by status: {report['repos_by_status']}")
    for r in report["repos"]:
        flags = []
        if not r.get("clean", True):
            flags.append(f"{r['uncommitted_change_count']} uncommitted change(s)")
        if r.get("ahead"):
            flags.append(f"{r['ahead']} ahead")
        if r.get("behind"):
            flags.append(f"{r['behind']} behind")
        if not r.get("has_ci_workflow"):
            flags.append("no CI workflow")
        if r.get("missing_required_files"):
            flags.append(f"missing required: {', '.join(r['missing_required_files'])}")
        if r.get("missing_recommended_files"):
            flags.append(f"missing recommended: {', '.join(r['missing_recommended_files'])}")
        detail = "; ".join(flags) if flags else "ok"
        print(f"  [{r.get('status', '?'):<8}] {r['name']:<28} [{r.get('github_org') or '?'}] {detail}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
