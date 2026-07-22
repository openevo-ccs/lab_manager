# Ecosystem Cleanliness — Definition, Daily Maintenance, and Safety Rails

| | |
|---|---|
| **Project** | Define what "perfectly clean" actually means for the OpenEvo CCS Lab's 16 repos, execute today's safe cleanup pass, and design a daily-recurring system that keeps it that way — without the automation itself becoming a new risk. |
| **Relationship to existing work** | Extends [`ecosystem-dashboard-and-health-monitoring-plan.md`](ecosystem-dashboard-and-health-monitoring-plan.md) §5 (git health) and §11 Open Decision 7 (stale-reference cleanup, opened last session). Same "never auto-merge," provenance-stamped, human-reviewed discipline as `ccs-insights-pipelines-plan.md` — applied here to *repo hygiene* instead of *content generation*. |
| **Document status** | Draft — today's cleanup (§2) is done and pushed. The daily-maintenance system (§4–§6) is proposed, **not yet built**; Open Decisions (§8) are checkpoints for Dustin before any of it runs unattended. |
| **Author** | Claude (planning pass), for review by Dustin Eirdosh |
| **Date** | 2026-07-22 |

## Table of Contents

1. [What "clean" actually means](#1-what-clean-actually-means)
2. [Today's cleanup — what got fixed, flagged, and cleared](#2-todays-cleanup--what-got-fixed-flagged-and-cleared)
3. [The safety model: three tiers of remediation](#3-the-safety-model-three-tiers-of-remediation)
4. [Daily job architecture](#4-daily-job-architecture)
5. [Expanding the checklist](#5-expanding-the-checklist)
6. [Near-term backlog (not automated, needs a decision first)](#6-near-term-backlog-not-automated-needs-a-decision-first)
7. [Phasing](#7-phasing)
8. [Open decisions](#8-open-decisions)
9. [Sources](#9-sources)
10. [Revision history](#10-revision-history)

---

## 1. What "clean" actually means

"Perfectly clean by the end of every day" needs a precise definition before it can be automated,
because a naive reading — *zero diffs, zero uncommitted changes, everything green, everywhere,
always* — is actually a bad goal, not just a hard one. A repo with uncommitted changes at 6pm
because Dustin is mid-thought on something is **healthy**, not dirty. A daily job that force-commits
or resets working trees to make the dashboard look green would be actively harmful — it could
commit broken/half-finished work, or destroy it. So "clean" has to split into two genuinely
different axes:

| Axis | Examples | What "clean" means here | Who/what can act on it |
|---|---|---|---|
| **Structural / governance** | Required files present (`README`, `LICENSE`), CI workflow present, remote points at the one canonical org, no stale cross-repo references, no committed secrets, schema validation passing | Can be, and should stay, **perfect** — these don't fluctuate with normal work | Safe to automate detection; some subset safe to automate *fixing*, via PR only (§3) |
| **Working state** | Uncommitted changes, commits ahead/behind `origin` | Never forced to zero — "clean" here means **not neglected**, not **not present**: a repo ahead-of-remote for 2 hours is normal; ahead-of-remote for 3 weeks untouched is the actual signal worth surfacing | Detection only, ever. Flag *staleness* (duration), never touch the content |

This doc's daily system targets the first axis and explicitly **never** touches the second beyond
reporting on it. That's not a limitation to work around later — it's the actual safety boundary
that makes "runs every day, unattended, across 16 repos" a reasonable thing to build at all.

## 2. Today's cleanup — what got fixed, flagged, and cleared

Concrete evidence this doc's approach works, not a hypothetical:

**Fixed and pushed** (structural-axis, mechanical, unambiguous — the stale `openevo-ccs-lab` →
`openevo-ccs` reference family from Open Decision 7):
- `eva4k12` (12 files: README, 2 docs, 9 framework JSON files) — commit `34d363b`
- `eva-graph` (1 mirrored JSON file) — commit `eadf244`
- `EvoMentor` (`docs/detailed_specs_v1.md`) — commit `9ba5bb5`
- `EvoMentor_DE` (`README.md`) — commit `f4b6bcc`

Every fix was verified against the same standard before touching anything: confirm the hit is a
live GitHub URL/metadata field, not a historical citation, not a local file path, not inside
`.git/` internals. Grep found 28 files total containing the string; **20 were left untouched**
because they failed that standard (see below) — this was a targeted fix, not a blind
find-and-replace across the ecosystem.

**Deliberately left alone, and why:**
- `curriculum-evolution/docs/archive/*`, `conceptbase/docs/design-notes/*` (dated planning docs'
  "Sources" citations), `eva_buch/bertopic/src/out/pipeline.log` — historical records. Rewriting
  them to match current facts would be revisionist, the same reason git history isn't rewritten.
- `check_repos.py`, `eva4k12/scripts/schema_generator.py`, `KoMet/Docs/monitoring/README.md` —
  these reference the **local disk path** `D:\dev\openevo-ccs-lab`, not the GitHub org. Fixing
  them now would make them *wrong* until the pending rename (see the sibling doc's §3) actually
  happens — these fixes are tied to that event, not to today's org cleanup.
- `ccs-graph/docs/FAIR_Curriculum.md` — this reads as **manuscript text for a published/submitted
  article** ("Correspondence regarding this article should be addressed to..."), not routine
  documentation. Editing a citable article's stated GitHub URL without knowing its publication
  status is a different kind of action than fixing a README — flagged for Dustin, not touched
  (§6).
- `EvoMentor/evomentor_LC_MCP/evomentor_lc_mcp.py`'s `github_raw_base` — checked, not just
  assumed: the referenced `evo_strategies` repo exists (both old and new org URLs resolve to the
  same commit, consistent with the rest of this ecosystem), but the actual data file URLs
  **already 404 today, under both org names** (`raw.githubusercontent.com/.../evo_strategies_k3.json`
  returns 404 either way). Renaming the org string here would create false confidence that this
  is "fixed" when the underlying fetch is still broken — likely a private-repo-vs-raw.-content
  access issue, a separate bug from the org staleness. Flagged, not silently patched (§6).

**Cleared, not just assumed clean**: a full-ecosystem scan of every tracked file's name for
credential-shaped patterns (`.env`, `*_key`, `*secret*`, `*credential*`, `.pem`, `.pfx`) across
all 16 repos found exactly one hit — `w3id.org/credentials/.htaccess` — read and confirmed benign
(a W3C Verifiable Credentials vocabulary redirect rule, not an auth file). No secrets committed
anywhere in the ecosystem today. This scan is worth making a permanent recurring check (§5), not
a one-time reassurance.

## 3. The safety model: three tiers of remediation

The load-bearing design decision for anything that runs daily and unattended:

| Tier | What | Examples | Runs how |
|---|---|---|---|
| **Tier 0 — Detect & report** | Default for everything. Scan, flag, land in the daily report (Tier 1 of the sibling doc's public/private split). No writes anywhere. | Missing CI, missing recommended files, ahead/behind duration, schema validation status | Safe to fully automate, safe to run unattended, safe to run in CI even |
| **Tier 1 — Detect & auto-PR, allowlisted only** | A small, explicit, versioned allowlist of mechanical, reversible, judgment-free fixes. Opens a PR. **Never merges it.** | Today's org-string fix, once formalized as a repeatable check (§5) — if this exact drift recurs, auto-open a PR with the fix instead of just flagging it | Safe to automate *opening the PR*; merge stays a human click, same discipline as every other contribution path in this ecosystem |
| **Tier 2 — Never automate** | Anything touching working-tree state (uncommitted changes, resets, force-push), anything requiring content judgment (license choice, README rewrite, a person's name/attribution, curriculum content), anything in `docs/archive/` or dated citation text | The 5 items flagged in §2, license selection for `KoMet`/`w3id.org`, CONTRIBUTING.md content (§6) | Human only, always |

**The allowlist itself is the safety mechanism, not a formality.** Nothing enters Tier 1 without
a specific, named, human-approved rule (e.g., "if a repo's own remote resolves to `openevo-ccs`
but the repo's tracked files still contain the literal string `openevo-ccs-lab` in a URL context,
open a PR replacing it" — narrow enough that it can't misfire on prose, archived docs, or path
references, because those were already excluded by construction when the rule was written).
Growing the allowlist is itself a reviewed decision, mirroring this doc's own Open Decision
discipline — not something the daily job can expand on its own.

## 4. Daily job architecture

Two separable commands, not one monolithic "clean everything" script — matching the Tier 0/Tier 1
split in §3 exactly:

```
scripts/git_health.py scan        # Tier 0 — already built (Phase 2). Read-only. Safe to
                                    # schedule unattended, today, with zero new risk.

scripts/git_health.py remediate   # Tier 1 — new (§7 Phase 2). Reads scan output, applies
  --dry-run                        # only allowlisted rules, opens PRs (never merges,
  --apply                          # never commits to main). --dry-run prints what it
                                    # would do without touching anything; --apply actually
                                    # opens the PRs. Both need GITHUB_TOKEN (repo-scoped,
                                    # personal, same discipline as every other token in
                                    # this ecosystem).
```

**Where it runs**: locally, same reasoning already established for `scan` in the sibling doc —
meaningful ahead/behind and uncommitted-change signals only exist against Dustin's real sibling
clones, not a fresh CI checkout. A local Task Scheduler entry running `scan` every morning is
low-risk and can start immediately (Phase 1, §7). `remediate --apply` stays a command Dustin runs
deliberately when he reviews the scan output — not wired into the same unattended trigger, at
least until the allowlist has a track record (§8 Open Decision 2).

**Why PRs, never direct commits to `main`, even for Tier 1**: this is the one rule everything
else in this section exists to protect. A bug in the remediation logic — a regex that's slightly
too broad, a template that's wrong for one repo's specific context — is cheap to notice and
discard as an unmerged PR, and expensive to notice as sixteen simultaneous bad commits on `main`.
The entire point of automating the mechanical stuff is to save review *time*, not to remove
review *itself*.

## 5. Expanding the checklist

New Tier 0 checks worth adding to `git_health.py`, each because today's session found a concrete
reason for it, not speculatively:

- **Stale-reference scanner** — formalize §2's manual grep into a repeatable check: a small,
  named list of "known-stale string → context rule" pairs (starting with exactly one entry:
  `openevo-ccs-lab` in a URL/metadata context). Catches recurrence automatically instead of
  relying on it being noticed by hand again. Graduates to Tier 1 (auto-PR) once its false-positive
  rate is proven at zero (§8 Open Decision 2).
- **Secret/credential filename scanner** — formalize §2's one-time scan into a recurring Tier 0
  check (same pattern list: `.env`, `*_key`, `*secret*`, `*credential*`, `.pem`, `.pfx`). Zero
  cost to run, meaningfully reduces the "nobody noticed a committed secret for weeks" risk.
- **Cross-repo broken-link check** — a repo's docs linking to another repo's file/section that no
  longer exists. Same kind of drift `openevo-graph`'s stale `caseLinks` already exemplified per
  `ccs-insights-pipelines-plan.md` §1.1, generalized into a standing check instead of a one-off
  finding.
- **Schema validation aggregation** — `conceptbase`, `bio-core-k12`, and `oe-interdisciplinary-k12`
  already run `validate.yml` on every push; the daily scan should read each repo's latest
  workflow-run status via the GitHub API (already has a token-gated API path, §5 of the sibling
  doc) rather than re-implementing validation locally.
- **Sandbox-entry age tracking** — `conceptbase`'s `OE-SANDBOX-*` entries auto-archive at 12
  months (`GOVERNANCE.md`); surfacing entries approaching that window was already named as a
  dashboard goal in the sibling doc §4 and fits naturally here as a Tier 0 check.

None of these are remediation — all Tier 0, report-only, until each has enough of a track record
to be considered for a narrow Tier 1 rule the same way §3 describes.

## 6. Near-term backlog (not automated, needs a decision first)

Flagged in §2, listed here as the concrete next actions rather than left implicit:

1. **`ccs-graph/docs/FAIR_Curriculum.md`**: confirm publication status before any edit — if it's
   an already-submitted/published manuscript, the GitHub URL text may need to stay exactly as
   published (with a correction handled however that venue requires), not silently patched here.
2. **`EvoMentor`'s `evo_strategies` data fetch**: broken independent of the org-name question
   (§2) — needs Dustin's own look at why `raw.githubusercontent.com` 404s for that repo/path
   today (private-repo access, wrong branch, wrong path — not diagnosed further this session).
3. **`CONTRIBUTING.md` rollout**: 11 of 16 repos are missing one (per today's `git_health.py`
   run). Mechanical to add, but the *content* needs a real per-repo judgment call (an LPM repo's
   contribution path runs through `conceptbase`'s RFC process; a tools repo's doesn't) — worth a
   quick template decision with Dustin before generating 11 files, not assumed (§8 Open
   Decision 3).
4. **`.gitignore` gaps**: `eva4k12` has none at all; several other repos are missing one.
   Lower-stakes than CONTRIBUTING.md (a `.gitignore` doesn't need repo-specific content judgment
   the same way) — reasonable Tier-1-allowlist candidate once §5's infrastructure exists, using
   `curriculum-agents`' existing `.gitignore` as the template.
5. **The `D:\dev\openevo-ccs-lab` → `D:\dev\openevo-ccs` rename** itself — still pending from the
   sibling doc §3/§11, blocking `check_repos.py`, `eva4k12/scripts/schema_generator.py`, and
   `KoMet`'s monitoring docs' path references from being fixed. Unchanged status; noted here only
   because it's the reason those three are excluded from today's cleanup.

## 7. Phasing

- **Phase 0 — This doc's sign-off.** Resolve §8. No unattended automation yet.
- **Phase 1 — Schedule `scan` locally (Tier 0 only).** Zero new risk — it's the same read-only
  script already built and tested, just on a timer (Task Scheduler) instead of run by hand.
  Immediately actionable.
- **Phase 2 — Build `remediate --dry-run`**, starting with exactly one allowlist rule (the
  stale-org-reference pattern, since today's manual pass already proves it's well-scoped). Review
  its output against today's known-good fix by hand before trusting it on anything new.
- **Phase 3 — `remediate --apply` opens real PRs**, still human-triggered, not on the Phase 1
  timer. Track its accuracy for a few real runs before considering Phase 4.
- **Phase 4 — Reconsider unattended `remediate`** only after Phase 3 has a track record and only
  for allowlist entries proven reliable — an explicit, later Open Decision, not a default.
- **§5's new checks and §6's backlog items** are independent of this phase order — pick up
  whichever makes sense next, they don't gate each other.

## 8. Open decisions

1. **Local Task Scheduler vs. staying manual for Phase 1's `scan`**: is a daily unattended
   read-only scan actually wanted, or does Dustin prefer running it himself each morning as part
   of a routine? Both are safe; this is a convenience preference, not a safety question.
2. **Allowlist graduation criteria for §5's new checks**: how many clean runs / how much manual
   spot-checking before a Tier 0 check is trusted enough to write its matching Tier 1 remediation
   rule? No default proposed — this is Dustin's risk tolerance to set, not a technical question.
3. **`CONTRIBUTING.md` template**: one shared template across all 16 repos, or two variants
   (LPM/content repos pointing at `conceptbase`'s RFC process vs. tools/code repos with a
   simpler PR flow)? Needed before §6 item 3 can proceed.
4. **`.gitignore` rollout timing**: bundle it into Phase 2's first `remediate` allowlist rule
   alongside the org-reference fix, or treat as a separate, later rule? Either is fine — this is
   sequencing, not a risk question.

## 9. Sources

- `ecosystem-dashboard-and-health-monitoring-plan.md` (this repo, sibling doc — §5, §11 Open
  Decision 7)
- `ccs-insights-pipelines-plan.md` (`conceptbase/docs/design-notes/`) — the never-auto-merge,
  provenance-stamped discipline this doc applies to hygiene instead of content
- Today's actual cleanup: commits `34d363b` (eva4k12), `eadf244` (eva-graph), `9ba5bb5`
  (EvoMentor), `f4b6bcc` (EvoMentor_DE) in this session, 2026-07-22
- Full-ecosystem credential-filename scan (this session, 2026-07-22) — one hit, confirmed benign
- `scripts/git_health.py` (this repo) — the existing Tier 0 scanner this plan extends

## 10. Revision history

| Date | Change |
|---|---|
| 2026-07-22 | Initial draft: today's cleanup executed and recorded (§2), daily-maintenance system proposed (§3–§7), not yet built beyond what §2 already shipped. |
