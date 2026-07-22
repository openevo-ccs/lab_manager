# Lab Manager — Ecosystem Dashboard, Git Health, and GWDG-for-Monitoring Plan

| | |
|---|---|
| **Project** | Design `lab_manager`'s actual scope: a public GitHub Pages dashboard reporting on the health and development of the whole OpenEvo CCS Lab ecosystem, ecosystem-wide git-health tooling, a GWDG SAIA strategy specific to *monitoring/QC* (a third use case, distinct from the two below), a daily/weekly reporting cadence with an explicit public/private data split, and the local-clone-vs-public-repo boundary question (including the `D:\dev\openevo-ccs-lab` rename). |
| **Relationship to existing work** | Sibling to [`gwdg-saia-ecosystem-plan.md`](../../../conceptbase/docs/design-notes/gwdg-saia-ecosystem-plan.md) (interactive GWDG use — apps, chat, MCP) and [`ccs-insights-pipelines-plan.md`](../../../conceptbase/docs/design-notes/ccs-insights-pipelines-plan.md) (local batch GWDG *content-generation* pipelines). This doc is the third leg: GWDG for *ecosystem health/QC monitoring*, plus the non-GWDG git-health and dashboard work those two docs don't cover. Reuses their established conventions (content-hash caching, provenance stamping, never-auto-merge, "GWDG calls stay interactive/human-triggered, never CI-automatic") rather than inventing new ones. Also draws on `D:\ccs_lab\lab_workflow.py` (a prior, simpler lab-manager concept — `--health-check`/`--audit`/`--strategic-review`/`--review-journal` CLI) for pattern inspiration, adapted to this ecosystem's real shape, not ported as-is. |
| **Document status** | Open Decisions (§11) resolved 2026-07-22. Phase 1 (§10) partially executed: `local/`/`reports/` scaffolding, `.gitignore`, `LICENSE`/`LICENSE-CODE`, and the GWDG key migration are done; the `D:\dev\openevo-ccs-lab` → `D:\dev\openevo-ccs` rename itself is still pending (see §11 "Rename status"). Not yet RFC'd. |
| **Author** | Claude (planning pass), for review by Dustin Eirdosh |
| **Date** | 2026-07-22 |

## Table of Contents

1. [What's actually there today](#1-whats-actually-there-today)
2. [The local-clone / public-repo boundary](#2-the-local-clone--public-repo-boundary)
3. [The rename question](#3-the-rename-question)
4. [Dashboard architecture](#4-dashboard-architecture)
5. [Ecosystem git health](#5-ecosystem-git-health)
6. [GWDG SAIA for health/QC monitoring — the third use case](#6-gwdg-saia-for-healthqc-monitoring--the-third-use-case)
7. [Daily and weekly reports](#7-daily-and-weekly-reports)
8. [Data security and FAIR practice](#8-data-security-and-fair-practice)
9. [What to keep from `D:\ccs_lab`'s lab_manager concept](#9-what-to-keep-from-dccs_lab s-lab_manager-concept)
10. [Phasing](#10-phasing)
11. [Open decisions](#11-open-decisions)
12. [Sources](#12-sources)
13. [Revision history](#13-revision-history)

---

## 1. What's actually there today

`lab_manager` itself is currently a two-file skeleton (`README.md`, `.git/`) already registered at
`github.com/openevo-ccs/lab_manager` — the repo exists and has a public home, but no content yet.
Worth being precise about the rest of the ecosystem before designing what it should report on:

**One GitHub org — `github.com/openevo-ccs` — not two.** An earlier pass of this doc (and the
Phase 2/3 dashboard it shipped) got this wrong: it read 6 repos' local `origin` remotes still
pointing at a pre-rename name (`github.com/openevo-ccs-lab`) and concluded there were two live
orgs. Corrected 2026-07-22, per Dustin: there is exactly one org, "The OpenEvo CCS Lab," at
`github.com/openevo-ccs`. Verified directly (not just asserted) before fixing anything:
`git ls-remote` against both `openevo-ccs-lab/<repo>.git` and `openevo-ccs/<repo>.git` for all 6
affected repos (`EvoMentor`, `EvoMentor_DE`, `ccs-graph`, `eva-graph`, `eva4k12`,
`openevo-graph`) returned the **identical HEAD commit SHA** at both coordinates — same repo,
same content, just an un-updated local remote URL from before the rename. No GitHub-side
transfer was needed; fixed locally with `git remote set-url origin
https://github.com/openevo-ccs/<repo>.git` for all 6, then verified each still fetches cleanly.

All 16 repos now correctly resolve to `github.com/openevo-ccs`:

| Repos | Character |
|---|---|
| `conceptbase`, `curriculum-agents`, `curriculum-evolution`, `bio-core-k12`, `oe-interdisciplinary-k12`, `OpenCASE`, `eva_buch`, `w3id.org`, `lab_manager` | Active, RFC-governed, `docs/design-notes/` discipline, real CI (`validate.yml`/`ci.yml`), GitHub Pages already live on `conceptbase` and now `lab_manager` |
| `EvoMentor`, `EvoMentor_DE`, `ccs-graph`, `eva-graph`, `eva4k12`, `openevo-graph`, `KoMet` | Mixed maturity, same org — `EvoMentor_DE` and `eva4k12` are real, populated curriculum data; `ccs-graph`'s README is boilerplate but its `edges/` schema is genuinely rich (per `ccs-insights-pipelines-plan.md` §1); `openevo-graph` looks dormant/superseded (same doc, §1.1); `EvoMentor`'s README has unfilled template sections; `KoMet` appeared mid-session, picked up automatically by `git_health.py`'s discovery-based scan with zero config changes |

`scripts/git_health.py` now treats this as a standing invariant, not a two-category split: any
repo whose remote doesn't resolve to `openevo-ccs` is flagged (`wrong_org`, at least `serious`
status) rather than silently bucketed as a second normal org. The dashboard's former "Repos by
GitHub org" chart — comparing two things that were never actually two things — is replaced with
a "Remote hygiene" panel (§4) that states the invariant directly and would surface it immediately
if this kind of drift ever recurred.

**Still open, and materially smaller than this doc originally assumed**: in-repo references to
the old `openevo-ccs-lab` name — READMEs' clone instructions, `eva4k12`'s JSON metadata
(`"publisher": "openevo-ccs-lab"`, `"affiliation": "openevo-ccs-lab"`, etc.), `EvoMentor`'s docs —
are stale *content*, not stale *infrastructure*. Fixing those means editing and pushing to those
6 repos individually; not done as part of this pass (see Open Decision 7, §11).

**Licensing is already a real, working discipline**, not something this doc needs to invent:
`conceptbase` runs dual CC-BY-NC-SA-4.0 (content) / MIT (code), `GOVERNANCE.md` defines a
sandbox→accepted→stable→deprecated→superseded lifecycle with **never-delete** semantics, and
`docs/design-notes/state-standards-licensing.md` + `scripts/case_license_gate.py` already encode
a conservative, fail-closed policy for third-party standards content. §8 below treats these as
inputs the dashboard should *surface*, not re-derive.

**`check_repos.py`** (repo root, not in any single repo) is the only existing ecosystem-wide git
script — 60 lines, checks `.git` presence, branch, dirty/clean, ahead/behind `origin/main`,
remote URL, and presence of `README.md`/`.gitignore`/`LICENSE`. It's a real, working starting
point for §5, not a from-scratch design — but it hardcodes `BASE_DIR` to the exact path this doc
is about to recommend changing (§3), assumes every repo's default branch is `main` (not checked —
worth verifying before reuse), and has no output format beyond stdout (no JSON, nothing a
dashboard could consume).

## 2. The local-clone / public-repo boundary

You described wanting the local clone to hold "additional specifics and reports... that do not
become public," in a git-ignored folder space. **No such convention exists yet anywhere in this
ecosystem** — checked `conceptbase/.gitignore` (minimal: `__pycache__/`, `*.pyc`),
`curriculum-agents/.gitignore` (broader, includes `.env`/`.env.*` — the only repo with that
pattern), and `eva4k12` (no `.gitignore` at all). This needs to be designed, not found.

**Recommendation:** a single top-level convention, adopted first in `lab_manager` and reusable by
any other repo that needs it:

```
lab_manager/
  local/                 # gitignored, entirely. Dustin's machine only.
    reports/              # full-detail daily/weekly reports (§7) — private tier
    gwdg-usage/            # per-run call/token logs (§6) — private tier
    cache/                  # vector indices, run manifests — same pattern
                              # ccs-insights-pipelines-plan.md §6 already established
    notes/                   # anything else local-only
  reports/                # committed, public — the *promoted* subset (§7)
    daily/
    weekly/
```

This mirrors a pattern already load-bearing in `ccs-insights-pipelines-plan.md` (local vector
index "not committed to git... regenerable from source content," §6) and in this ecosystem's
broader discipline of agent/local output never landing directly on `main` (§7 there, §8 here) —
just applied to *reports* instead of *content*. A single `local/` directory, gitignored with one
line (`local/`), is simpler than scattering exclusions per-subfolder and easy to audit.

**Open Decision 1 (§11):** should this `local/` convention also apply retroactively to other
repos (e.g. does `check_repos.py`'s eventual replacement belong in `lab_manager`, reading *other*
repos' state without needing a `local/` of their own — the likely answer, since `lab_manager` is
the one place that needs to persist private cross-repo state)?

## 3. The rename question

**Verdict: safe, with two mechanical fixes and one deliberate re-registration — not a "nothing
depends on it" but a "everything that depends on it is small and enumerable."**

Checked by grepping all 14 local repos for the literal string `openevo-ccs-lab` (22 hits) and for
absolute-path patterns (`D:\dev\openevo` / `D:/dev/openevo`, 5 hits):

- **20 of the 22 string hits are the GitHub org name** in URLs/prose (`github.com/openevo-ccs-lab/...`,
  `"publisher": "openevo-ccs-lab"` in `eva4K12_*.json` metadata) — **unrelated to the local disk
  path**, unaffected by a folder rename either way. (These *do* relate to §1's org-consolidation
  question, but that's a separate, much bigger decision than moving a folder — not in scope here.)
- **Exactly 2 files hardcode the actual absolute path**: `check_repos.py`
  (`BASE_DIR = Path(r"D:\dev\openevo-ccs-lab")`) and `eva4k12/scripts/schema_generator.py`
  (`SOURCE_DIR`/`TARGET_DIR`). Both one-line fixes.
- **What actually breaks silently, not committed to any repo**: `~/.claude/agents` and
  `~/.claude/skills` are symlinks to `/d/dev/openevo-ccs-lab/curriculum-agents/{agents,skills}` —
  a rename orphans them into dangling symlinks (no error, agents/skills just silently disappear
  from every Claude Code session machine-wide until re-linked). `~/.claude.json` keys a
  per-project settings block by exact absolute path for six projects (`conceptbase`, `eva_buch`,
  `curriculum-evolution`, `curriculum-agents`, `oe-interdisciplinary-k12`, `lab_manager`) — all
  currently near-empty defaults (no accumulated permissions/MCP config yet), so low stakes today,
  but a rename creates fresh entries rather than migrating old ones, and any *future* per-project
  config accumulated before a rename would be silently orphaned the same way.

**None of this is git-repo content** — every fix listed is local-machine state (symlinks, a
user-level JSON config, two personal utility scripts), which is exactly why it's safe to change
without touching anything that could affect a collaborator, CI, or the public repos themselves.

**Recommended target, given Open Decision-2's org-consolidation lean:** `D:\dev\openevo-ccs` —
matches the org every repo in this ecosystem actually lives under (§1), rather than the stale
pre-rename name. A rename to something else (just shortening, e.g. `D:\dev\ccs`) is a valid
alternative if org-name alignment isn't the goal — this doc defaults to org-alignment since it's
already the direction you confirmed.

**Sequencing, if approved:** update the 2 scripts, recreate both symlinks pointing at the new
path, rename the folder, then let `~/.claude.json` re-register the six project paths naturally on
next open (nothing to migrate, given the current empty state) — all as one atomic session, not
staggered, so there's no window where symlinks point at a folder that no longer exists.

## 4. Dashboard architecture

Matches this ecosystem's own stated design principle (`gwdg-saia-ecosystem-plan.md` §6: "static/
git-native/no-backend") and reuses real precedent already in the ecosystem rather than inventing
a new deploy pattern: `conceptbase/.github/workflows/pages.yml` already deploys a static
"ConceptBase Explorer" (`app/` + generated `registry/` → `_site/`); `eva_buch` already serves an
interactive app from `docs/` via Pages. `lab_manager`'s dashboard is the same shape at ecosystem
scope: a static site, built by GitHub Actions, deployed to Pages, reading committed JSON — not a
live backend querying anything at request time.

**Two-tier data model**, following directly from §2's public/private split and a hard constraint
already established in `gwdg-saia-ecosystem-plan.md` §6 ("Keep GWDG-model calls interactive/
human-triggered, not CI-automatic... a shared service key is a bad idea for anything automated at
repo scale"):

| Tier | Generated by | Uses GWDG? | Lands in |
|---|---|---|---|
| **Tier 1 — repo/git health** | `scripts/git_health.py`, run locally against Dustin's sibling clones (see correction below) | No | `reports/daily/*.json` (public, committed) → dashboard |
| **Tier 2 — GWDG-assisted QC/insight** | Dustin's own machine, on demand or on his own schedule (cron/Task Scheduler, not GitHub Actions), using his personal SAIA key per `ccs-insights-pipelines-plan.md`'s existing local/batch model | Yes | `local/reports/` (private, full detail) by default; a **deliberate, human-reviewed promotion step** copies a redacted/aggregated summary into `reports/` when Dustin chooses to publish it |

**Correction found while building Phase 2, worth recording rather than quietly fixing**: this
table originally said Tier 1 runs via a *scheduled GitHub Actions workflow reading the GitHub
API*. That's only true for part of it. `git_health.py` (built and tested this session) reports
two genuinely different kinds of signal:

- **Local-clone-only signals** — uncommitted-change count, ahead/behind vs. `origin` — are
  properties of *Dustin's own working copy*, not of the public repo. A GitHub Actions runner
  starting from a fresh `git clone` would always report "clean, 0 ahead, 0 behind" for every
  repo, since it just cloned exactly what's on the remote — making these fields meaningless if
  computed in CI. These can only be generated by running locally against the real sibling
  clones under the lab root, the same reason `ccs-insights-pipelines-plan.md`'s pipelines are
  local/batch rather than CI jobs (though for a different underlying reason than that doc's
  GWDG-rate-limit constraint — this one is about what data even *exists* to read).
- **Pure GitHub-API signals** — CI workflow presence, open issue/PR counts, license/README
  presence, days since last push — need no local clone at all and *could* run in a scheduled
  GitHub Actions workflow calling the GitHub API directly, repo by repo, entirely independent of
  Dustin's machine. `git_health.py` already fetches these when a `GITHUB_TOKEN` is available
  (`github_api` field per repo), it just currently does so as one script alongside the
  local-only checks rather than as a separable CI-only job.

Both are still "Tier 1" in the sense that matters (no GWDG, output is public/non-sensitive) —
this is a correction about *where* generation happens, not about the public/private split. For
now, Tier 1 stays a single locally-run script (simplest, and the local-only signals are
genuinely useful); splitting the GitHub-API-only subset into its own scheduled Action is a real
future option if the report should update even on days Dustin doesn't run it locally, not
something to build speculatively now.

This is the same shape §5/§7 of `ccs-insights-pipelines-plan.md` already uses for content
(STAGE → human review → PR, never auto-committed) — applied to *reports* instead of *drafted
records*. It also resolves the "only some of which aggregated data becomes part of the public
repo" requirement structurally: Tier 1 is public by construction (it's non-sensitive git/CI
metadata), Tier 2 is private by default and public only by an explicit, visible act.

**What Tier 1 (public) plausibly shows:**
- Per-repo: branch/clean status, CI pass/fail, days since last commit, open issue/PR counts,
  license/README/CONTRIBUTING completeness (extending `check_repos.py`'s existing checklist)
- `conceptbase`-specific: sandbox entries by age (flagging ones approaching the 12-month
  auto-archive per `GOVERNANCE.md`), RFC pipeline status (`proposals/` by lifecycle stage),
  schema validation pass rate over time
- LPM-specific (`bio-core-k12`, `oe-interdisciplinary-k12`): strand/objective counts, stub vs.
  complete objectives, `status: proposed` → `accepted` progress
- `curriculum-agents`-specific: agents/skills/processes implemented vs. specified (the README's
  own status table, §1) tracked over time rather than as a point-in-time snapshot

**What stays Tier 2/private:** raw GWDG call logs and any cost/quota approximation (§6), full
verbose `git status`/uncommitted-diff content (could reveal unpublished draft material before
Dustin chooses to share it), anything sourced from `local/notes/`, partner-institution-identifying
detail if any ever appears in local reports.

**Private-repo scope, decided 2026-07-22**: 5 of the 16 repos (`EvoMentor`, `ccs-graph`,
`eva-graph`, `eva4k12`, `openevo-graph`) are private on GitHub, discovered while fixing §1's
org-attribution bug. Decision: include them in the public Tier 1 dashboard anyway — branch
status, commit recency, and missing-file flags don't reveal repo content, and tracking WIP
private repos' health is useful. Not a default to revisit unless a specific repo's *existence*
itself needs to stay undisclosed, which would be a different, narrower call than this one.

## 5. Ecosystem git health

Extends `check_repos.py` rather than replacing its logic wholesale — same checks, restructured
for machine-readable output plus the org-invariant check (§1):

- **Per-repo checks**: `.git` presence, current branch (don't assume `main` — read the actual
  default branch), clean/dirty working tree, ahead/behind vs. remote, remote URL (flagged if it
  doesn't resolve to the one canonical `openevo-ccs` org — §1), presence of `README.md`/`LICENSE`/`.gitignore`/
  `CONTRIBUTING.md`/CI workflow file, days since last commit, open issues/PRs (GitHub API, needs
  a token — same "bring your own token, don't share one" discipline as GWDG keys, see §6/§8).
- **Ecosystem-level checks**, new relative to `check_repos.py`: broken cross-repo references (a
  repo's docs linking to another repo's file/section that no longer exists — the kind of drift
  `openevo-graph`'s stale `caseLinks` already exemplifies per `ccs-insights-pipelines-plan.md`
  §1.1), duplicate/orphaned design-notes docs, `.gitignore` convention consistency (§2's `local/`
  pattern — is it present where it should be, has anything sensitive leaked into a commit that
  should've been gitignored).
- **Output**: structured JSON per run (one file per repo or one combined manifest), not just
  stdout — the actual gap `check_repos.py` has today that blocks feeding a dashboard.
- **Cadence**: this tier needs no GWDG call and no personal key, so it's exactly the kind of check
  safe to run in GitHub Actions on a schedule (§4 Tier 1) — hourly/daily is cheap; no rate-limit
  concern comparable to GWDG's, though GitHub's own API rate limits still apply per-token.

## 6. GWDG SAIA for health/QC monitoring — the third use case

`gwdg-saia-ecosystem-plan.md` covers *interactive* GWDG use (apps, chat, MCP tool-calling).
`ccs-insights-pipelines-plan.md` covers *local batch content-generation* (drafting new
`ccs-graph` relations, sandbox candidates). This doc's use case is narrower and different from
both: **using GWDG to help Dustin understand the state of the ecosystem, not to draft new
content into it.** Reuses the same harvest→embed→adjudicate→stamp shape (§2 of that doc) but the
output is a *report finding*, never a PR against `conceptbase`/`ccs-graph`/an LPMR.

| Use | GWDG service | Why | Where it runs |
|---|---|---|---|
| Cross-repo consistency narrative ("what changed this week, what needs attention") | A strong chat model, fetched from `/models` at call time (never hardcoded — the rule both sibling docs already state, and the one `EvoMentor` itself violates today per `gwdg-saia-ecosystem-plan.md` §3/§6) | Synthesizing Tier 1's raw JSON (§4/§5) into prose priorities/risks/opportunities is exactly `D:\ccs_lab\lab_workflow.py`'s `--strategic-review` idea (§9) — a genuinely good pattern, just needs a real data source under it | Locally, Dustin-triggered (§4 Tier 2) |
| Semantic drift/near-duplicate detection across the whole corpus, as a *QC signal* rather than a content-drafting input | `/embeddings` | Same mechanism `ccs-insights-pipelines-plan.md` §2 Stage 2–3 already specifies — reusable as-is, just consumed by a report instead of a draft-record generator | Locally (§4 Tier 2) |
| Periodic QA on the health-report generator's own prior outputs | A second, different GWDG model, run on a sample (monthly-scale, not per-run) | Same ensemble-check idea as `ccs-insights-pipelines-plan.md` §3's last row — applies equally well to catching this pipeline's own blind spots | Locally, low-volume (§4 Tier 2) |

**Hard constraint carried forward from both sibling docs, restated because it's the single fact
that shapes §4's Tier split:** GWDG calls must stay interactive/human-triggered. No workflow in
this doc puts a GWDG call inside a GitHub Actions job — that would require either a shared key
(against GWDG's own terms) or per-contributor keys in CI secrets (impractical, and `lab_manager`
has no contributors yet needing that path). If that constraint is ever revisited directly with
GWDG, it changes this section; until then, treat it as fixed.

**Usage self-monitoring** (part of what you asked for): GWDG's documented API surface (per
`gwdg-saia-ecosystem-plan.md` §2/§9) doesn't include a usage/billing endpoint — track locally
instead, the same way `ccs-insights-pipelines-plan.md` §6 already proposes a local run manifest
(per-call: timestamp, model, endpoint, approximate token count from the response). This log lives
in `local/gwdg-usage/` (§2), feeds the private daily report (§7), and is the mechanism for
"respectful usage" — a visible running count against the documented tiers (~1,000/min, ~10,000/hr,
~50,002/day example figures), not a hope that nothing goes over.

## 7. Daily and weekly reports

| | Daily | Weekly |
|---|---|---|
| **Tier 1 content (public)** | Repo status deltas since yesterday — new commits, CI status changes, newly-stale sandbox entries | Rollup trends — commit velocity per repo, RFC/proposal throughput, LPM completion trajectory, CI pass-rate trend |
| **Tier 2 content (private, `local/reports/`)** | Everything Tier 1 has, plus: full `git status`/diff detail, GWDG call log for the day (§6), any strategic-review narrative Dustin ran that day | Same rollup as Tier 1's weekly, plus a GWDG-synthesized strategic narrative (§6's first row) — the closest analog to `lab_workflow.py`'s `--strategic-review` |
| **Generation** | Tier 1: GitHub Actions, scheduled (§4). Tier 2: local script, run on demand or via a local scheduler (cron/Task Scheduler — not GitHub Actions, per §6's constraint) | Same split |
| **Promotion to public** | N/A for daily detail by default | A human step: Dustin reviews a week's private report and optionally copies an aggregated/redacted excerpt into `reports/weekly/` for the dashboard — never automatic (§4) |

**Format**: JSON as the source of truth (both tiers), same reasoning as §5 — a dashboard needs
structured data, not prose logs. Tier 2's strategic-narrative prose can be markdown alongside its
JSON, matching `D:\ccs_lab\lab_workflow.py`'s `--review-journal` idea of a running human-readable
log, kept local unless explicitly promoted.

## 8. Data security and FAIR practice

- **Findable/Accessible**: the public dashboard *is* the FAIR-facing surface — Tier 1 data (§4)
  as committed JSON with a stable URL structure (`reports/weekly/2026-W30.json` style) is
  trivially findable/accessible/citable, more so than a one-off report buried in a chat log.
- **Interoperable**: reuse existing schemas wherever a report references content that already has
  one — a report row about a `ccs-graph` relation should carry that relation's real ID, not a
  re-derived label; same for `OE-CONCEPT-######`/`OE-SANDBOX-*` IDs from `conceptbase`. Don't
  invent parallel identifiers for things this ecosystem already names.
- **Reusable**: license the dashboard's own generated report data explicitly — recommend MIT for
  the `lab_manager` *tooling* (matching `curriculum-agents`' MIT-for-tools / CC-BY-NC-SA-4.0-for-
  content split) and treat the report *data* itself as a factual/derived-metrics artifact, likely
  also fine under a permissive license (CC0 or CC-BY) since it's operational metadata, not
  original curriculum content — worth a short, explicit statement rather than silence (Open
  Decision 3, §11).
- **Security**: no secrets in any repo, ever — `curriculum-agents`' existing `.env`/`.env.*`
  `.gitignore` pattern is the one convention worth replicating into `lab_manager` and any other
  repo missing it (`eva4k12` currently has no `.gitignore` at all — a real, if minor, gap worth
  fixing opportunistically). GWDG and GitHub tokens both stay personal, per-user, never shared —
  consistent with both sibling docs' existing discipline, not a new rule.
- **Never-delete tension, resolved**: `conceptbase/GOVERNANCE.md`'s never-delete identifier
  policy is a *content* discipline; report data is different, and doesn't inherit that policy's
  identifier-level permanence — see §11's resolved retention policy (30-day daily → monthly
  compressed archive, 1-year weekly → quarterly compressed archive; nothing hard-deleted, just
  consolidated).

## 9. What to keep from `D:\ccs_lab`'s lab_manager concept

That prototype (`lab_workflow.py` + an `agents/lab_manager/lab_manager.py` it shells out to) is
simpler than what this doc designs, but three ideas are worth carrying forward deliberately:

- **The four-verb shape** — `health` / `audit` / `status` / `strategic` — maps cleanly onto this
  doc's split: `health`/`audit` ≈ §5's Tier 1 git-health checks (no GWDG needed), `strategic` ≈
  §6/§7's GWDG-synthesized narrative (Tier 2, human-triggered). Worth keeping as the CLI's actual
  verb set rather than inventing new names.
- **`check_api_config()`'s pattern** of checking for a key in environment variables before
  attempting any GWDG-dependent command, failing fast with a clear message — good defensive
  practice, reusable directly. Its env var list (`GWDG_API_KEY`, `SAIA_API_KEY`,
  `OPENAI_API_KEY`) should be reconciled with `EvoMentor`'s actual names
  (`GWDG_LLM_KEY`/`GWDG_LLM_URL`/`GWDG_LLM_MODEL`) rather than carrying over a possibly-stale
  guess — Open Decision 5 (§11).
- **`--review-journal`** as a concept (a running human-readable log Dustin can read back) —
  keep the *idea*, relocate it to `local/notes/` or `local/reports/` per §2's convention rather
  than a bare root-level file.

**Not** worth carrying forward as-is: the prototype's `agents/lab_manager/lab_manager.py`
subprocess-shelling architecture (this ecosystem now has `curriculum-agents`' actual agent/skill/
tool model — a `lab_manager` reporting agent, if one makes sense, should be a real
`curriculum-agents/agents/*.md` persona calling real `tools/`, not a bespoke JSON-over-subprocess
protocol reinvented here) — this newer ecosystem is materially more advanced than that prototype
and the new work should look like it, not like a port.

## 10. Phasing

- **Phase 0 — This doc's sign-off.** Resolve §11. No code, no rename executed yet.
- **Phase 1 — `local/` convention + rename (§2, §3).** Smallest, most mechanical phase; unblocks
  everything else having a stable place to write to.
- **Phase 2 — Tier 1 git health (§5).** Extend `check_repos.py` into a JSON-emitting script
  covering both orgs; no GWDG, no Pages yet — just get real structured data flowing.
- **Phase 3 — Dashboard skeleton (§4).** Static Pages site reading Phase 2's JSON; ugly-but-real
  before polished — matches `conceptbase/pages.yml`'s existing pattern.
- **Phase 4 — Daily/weekly report generation + promotion flow (§7).** Both tiers; promotion stays
  manual from day one.
- **Phase 5 — GWDG-for-monitoring (§6).** Deliberately last — it depends on Phase 2's real data
  existing to synthesize over, and it's the one phase with real usage-discipline stakes (§6, §8)
  worth not rushing.

## 11. Open decisions — resolved 2026-07-22

All six resolved this session (Dustin: "use your default assumptions... use OpenEvo
conventions"). Recorded here for the decision trail, not still open.

1. **`local/` convention scope (§2): confirmed as default** — `lab_manager` only, for now.
   Already scaffolded: `local/{reports,gwdg-usage,cache,notes}/`, `local/.env`, all covered by
   one `local/` line in `.gitignore` (verified with `git check-ignore` before anything sensitive
   was written into it).
2. *(Resolved previously: consolidate on `openevo-ccs`, target `D:\dev\openevo-ccs`, treat
   `openevo-ccs-lab` as legacy — §1, §3. Execution tracked separately, §"Rename status" below.)*
3. **License for report data: OpenEvo's standard split, applied directly** — `docs/**` and
   `reports/**` (generated public report data) under CC-BY-NC-SA-4.0 (`LICENSE`, matching
   `conceptbase`/`curriculum-agents`' content license); dashboard/health-check code under
   `scripts/`, `app/` under MIT (`LICENSE-CODE`). Both files now exist at repo root, copied from
   `curriculum-agents`' exact license text with `lab_manager`'s own path references.
4. **Retention window: consolidate, don't keep raw indefinitely and don't hard-delete.**
   Concrete policy: daily Tier 1 reports stay as individual raw JSON for a **30-day rolling
   window**; on rollover, the month's daily records get **concatenated and synthesized into one
   compressed monthly archive record** (`reports/daily/archive/YYYY-MM.json`, superseding the
   individual files it summarizes) rather than pruned outright — same "never really lose the
   data, just compress it" spirit as `GOVERNANCE.md`'s never-delete policy, without inheriting
   that policy's *identifier*-level permanence (this is operational metadata, not a registered
   entity). Weekly reports stay uncompressed for a **1-year rolling window**, then consolidate
   into a compressed quarterly archive the same way. Tier 2 (`local/`) reports follow the same
   shape but are Dustin's own call entirely, since they never leave his machine.
5. **Env var reconciliation: tested and migrated.** `D:\ccs_lab\.env`'s `GWDG_API_KEY` was
   tested live against `GET https://chat-ai.academiccloud.de/v1/models` this session — **HTTP
   200, a real current model roster returned** (confirming the key is still active — and,
   incidentally, confirming this doc's/`gwdg-saia-ecosystem-plan.md`'s "never hardcode a model
   name" warning first-hand: the live roster no longer resembles `D:\ccs_lab`'s hardcoded
   `GWDG_MODEL=meta-llama-3.1-8b-instruct` default). Migrated into
   `lab_manager/local/.env` (gitignored, confirmed via `git check-ignore`) under the
   `EvoMentor`-established names — `GWDG_LLM_URL`, `GWDG_LLM_KEY`, `GWDG_LLM_MODEL` — with
   `SAIA_API_KEY` carried forward unreconciled for now. `D:\ccs_lab\.env` itself was left
   untouched (out of scope — separate legacy project, not this ecosystem).
6. **Org-level consolidation follow-up doc: moot, not deferred.** This assumed a real GitHub
   org-migration decision (transfer 6 repos between orgs). Investigation on 2026-07-22 (see §1's
   correction) found there was never a second org to migrate away from — all 6 repos already
   live under `openevo-ccs`; only their *local* remotes were stale. Fixed directly (§1, §3), no
   follow-up doc needed for this.
7. **In-repo stale `openevo-ccs-lab` references** (§1's correction) — READMEs' clone
   instructions, `eva4k12`'s JSON metadata fields, `EvoMentor`'s docs, `check_repos.py` and
   `eva4k12/scripts/schema_generator.py`'s hardcoded paths (unrelated to the org name, but the
   same "stale reference" family) — across 6 separate repos. **Not resolved this session** —
   fixing it means committing and pushing to each of those repos individually, a bigger action
   than the local-only remote-URL fix. Ask Dustin before doing this: fix all of them now in one
   pass, or treat it as routine cleanup the next time each repo is touched anyway?

### Rename status

Not yet executed. Flagged separately from the rest of this session's work: the live Claude Code
session that produced this plan is itself running with its working directory inside
`D:\dev\openevo-ccs-lab\lab_manager`, and Windows will not let a directory be renamed while a
running process holds it as a working directory (or VS Code has it open as a workspace root) —
so this needs to happen at a moment chosen deliberately, not folded silently into an unattended
batch of edits, even though the analysis in §3 stands. See the accompanying chat response for the
exact command sequence and timing options.

## 12. Sources

- `check_repos.py` (repo root, `D:\dev\openevo-ccs-lab\check_repos.py`)
- `D:\ccs_lab\lab_workflow.py` (legacy prototype, local clone only, not in either GitHub org)
- `conceptbase/GOVERNANCE.md`, `conceptbase/docs/design-notes/state-standards-licensing.md`,
  `conceptbase/scripts/case_license_gate.py`, `conceptbase/.github/workflows/{pages,validate}.yml`
- `conceptbase/docs/design-notes/gwdg-saia-ecosystem-plan.md`,
  `conceptbase/docs/design-notes/ccs-insights-pipelines-plan.md` (sibling docs)
- `curriculum-agents/README.md`, `curriculum-agents/docs/roadmap.md`, `curriculum-agents/.gitignore`
- `EvoMentor/evomentor_LC_MCP/evomentor_lc_mcp.py` (GWDG env var/auth pattern)
- Local grep/survey of all 14 repos' `README.md`, license badges, `.github/workflows/`, git
  remotes (this session, 2026-07-22)
- `~/.claude/agents`, `~/.claude/skills` (symlinks), `~/.claude.json` (project registry) — local
  machine state checked for §3

## 13. Revision history

| Date | Change |
|---|---|
| 2026-07-22 | Initial draft, written for review — not yet implemented, not yet RFC'd. |
| 2026-07-22 | Open Decisions 1/3/4/5/6 resolved; Phase 1 scaffolding executed (`local/`, `reports/`, `.gitignore`, `LICENSE`/`LICENSE-CODE`); legacy GWDG key tested live and migrated to `local/.env`. Rename (§3) still pending — see §11. |
| 2026-07-22 | Phase 2: `scripts/git_health.py` built, tested against the live 16-repo ecosystem, one real bug found and fixed (org-attribution regex broke on dotted repo names like `w3id.org`). Phase 3: dashboard (`app/`) built, GitHub Pages workflow added, verified rendering correctly in both light and dark mode via a local Playwright check (§4's Tier 1 generation model corrected based on what Phase 2 actually required — see the note inserted above). |
| 2026-07-22 | **Correction**: the "two GitHub orgs" premise (§1) was wrong. Verified via `git ls-remote` that all 6 "legacy-org" repos already live under `openevo-ccs` (identical HEAD SHA at both URLs) — only their local `origin` remotes were stale. Fixed with `git remote set-url` for all 6, added a standing `wrong_org` invariant check to `git_health.py`, replaced the dashboard's "Repos by GitHub org" chart with a "Remote hygiene" panel, dropped the now-pointless org filter, removed the unused `charts.js` module. Open Decision 6 closed as moot; new Open Decision 7 (in-repo stale-reference cleanup across 6 repos) recorded, not resolved. |
