# Ecosystem-Wide Authoring Format, Shared Style Guide, and WordPress Ingestion Plan

| | |
|---|---|
| **Project** | Close four gaps in the OpenEvo CCS Lab ecosystem that `docs/design-notes/openevo-graph-and-ccs-graph-design-governance-concept.md` didn't cover: (1) `openevo-graph`/`ccs-graph` hand-author JSON while the rest of the governed ecosystem authors YAML; (2) no stated position on whether/when RDF is actually needed, or why; (3) OpenEvo's visual identity (CSS design tokens) is copy-pasted by hand across static apps rather than shared; (4) `openevo-graph` should systematically scrape `openevo.eva.mpg.de`'s WordPress REST API to keep a structured mirror of TeachingBase/ProjectBase content aligned to OpenEvo's ontology. |
| **Relationship to existing work** | Extends, does not replace, `openevo-graph-and-ccs-graph-design-governance-concept.md` — that note's resolved migration plan (§9) for content anchors, thinking tools, competencies, concepts, and the CASE crosswalk stands as written. This note covers format/tooling/style/ingestion concerns that note explicitly didn't address. Builds on `conceptbase/docs/oecb_specifications.md` §3/§5 (the YAML-authoring/compiled-RDF split OECB already committed to) and `lab_manager/scripts/daily_scan.ps1` (the existing scheduled-job pattern this note's WordPress sync reuses). |
| **Document status** | Draft — four open questions resolved directly with Dustin Eirdosh 2026-07-23 (recorded inline below); execution started same day, see §8. |
| **Author** | Claude (planning pass), for review by Dustin Eirdosh |
| **Date** | 2026-07-23 |

## Table of Contents

1. [Why this, why now](#1-why-this-why-now)
2. [Authoring format: YAML over JSON, ecosystem-wide](#2-authoring-format-yaml-over-json-ecosystem-wide)
3. [RDF and SPARQL: why, when, and why not here](#3-rdf-and-sparql-why-when-and-why-not-here)
4. [Shared design tokens](#4-shared-design-tokens)
5. [WordPress ingestion](#5-wordpress-ingestion)
6. [How this weaves into the existing plan](#6-how-this-weaves-into-the-existing-plan)
7. [Execution sequence](#7-execution-sequence)
8. [Progress](#8-progress)

---

## 1. Why this, why now

Dustin raised five points about `openevo-graph`/`ccs-graph`'s alignment with the rest of the ecosystem. Checked against the actual state of every sibling repo (not summary):

| Point raised | Status |
|---|---|
| JSON instead of YAML like elsewhere | **Real gap, unaddressed by the existing design note.** Confirmed: `openevo-graph` and `ccs-graph` hand-author JSON; `conceptbase`, per its own §3.3 design principle, requires YAML authoring with JSON/RDF as compiled output only. |
| No clear pathway from JSON/YAML to RDF, or why it'd help | **Real gap.** OECB's own spec (§5.2-5.3) already has an answer — RDF/SPARQL is Phase 4, compiled-layer-only, and exists specifically for cross-vocabulary relational queries. Neither `openevo-graph` nor `ccs-graph` currently states whether that applies to them. |
| Strategic integration with curriculum-agents | **Already resolved** by the existing design note §5's dependency diagram and §8's management concept. Nothing new to add here. |
| No schemas should live in `openevo-graph`/`ccs-graph`; OECB owns ontology/vocab/schema | **Already resolved** — this is precisely §3/§9.1 of the existing note (content anchors/thinking tools migrate to OECB as tagged `oe:Concept` entries; `openevo-graph`'s own `schema/` directory holds only its local CASE-crosswalk shape, not curriculum ontology). |
| `openevo-graph` should store generalizable design/style-guide elements (CSS etc.) | **New, and real** — verified duplication below. |
| `openevo-graph` should monthly-scrape `openevo.eva.mpg.de`'s WordPress REST API | **New.** Verified live against the actual site (not assumed) — findings in §5. |

Two things were checked directly rather than assumed, because they change the shape of the recommendation:

**CSS duplication is real and already self-acknowledged.** `conceptbase/app/css/styles.css` and `lab_manager/app/css/styles.css` share ~280 lines of near-identical `:root` design tokens (surfaces, text colors, series colors, radii, dark-mode overrides). `lab_manager`'s copy says so in its own header comment: *"Palette tokens copied verbatim from conceptbase/app/css/styles.css ... reused, not re-derived."* Both also attribute the actual source of truth to a third place — the `dataviz` skill's `references/palette.md` — meaning the tokens' canonical origin isn't currently a repo at all. Every future static app (OpenCASE's editor has its own independent CSS too) will keep re-copying this by hand unless it has one real home.

**The WordPress site has 8 custom post types, not 2, and one of them is confusingly also called `conceptbase`.** A live query against `openevo.eva.mpg.de/wp-json/wp/v2/types` returned `teachingbase`, `projectbase`, `conceptbase`, `questionbase`, `methodsbase`, `literaturebase`, `domainbase`, `events` — all custom, all beyond a stock WordPress install. A sample `teachingbase` entry carries taxonomy term arrays for `concepts`, `subject_areas`, `grades`, `content_anchors`, `teaching_material_types`, `learning_goals`, `sustainable_development_goals`, `projects`, `biological_taxonomy`, `teachingbase_collections`, `csl_phase` — i.e., the live site already has its own structured taxonomy for exactly the vocabulary `openevo-graph` and OECB independently govern. **Confirmed with Dustin (2026-07-23): the WordPress content and the GitHub ontology evolved independently** — this is not a case of one being a transcription of the other, so a sync pipeline must treat WordPress as a *new, unreconciled* data source, not a replacement or a straightforward re-import.

## 2. Authoring format: YAML over JSON, ecosystem-wide

**Recommendation:** adopt OECB's own already-stated split (spec §3.3, §5.1-5.2) as the ecosystem-wide rule, not just an OECB-internal one:

> **Hand-authored content is YAML, reviewed via pull request. Generated or compiled output — flat JSON indices, RDF/JSON-LD, registry mirrors — is a build artifact, never hand-edited.**

This isn't a new philosophy invented for this note; it's applying one the ecosystem already committed to (and lives by, in `conceptbase/vocabularies/*.yaml`, `conceptbase/alignments/*.yaml`) to the two repos that predate it.

Concretely, per the existing design note's own asset inventory (§3-4 of the governance-concept note):

| Asset | Current format | Disposition |
|---|---|---|
| `openevo-graph/nodes/content_anchors.json`, `thinking_tools.json` | Hand-authored JSON | Per the existing plan (§9.3), these become a **generated mirror** post-RFC-migration — sourced from OECB's own YAML vocabulary and regenerated the same way `conceptbase/scripts/build_registry.py` produces flat JSON today. They stay JSON, but stop being hand-edited. No format migration needed here — the existing plan already resolves this correctly. |
| `openevo-graph/nodes/competencies.json`, `concepts.json` | Hand-authored JSON | Retired per the existing plan (pure OECB duplicates) — moot for format purposes. |
| `openevo-graph/nodes/case_frameworks.json`, `case_standards.json`, `metadata/crosswalk_index.json` | Hand-authored JSON | **Convert to YAML.** This is `openevo-graph`'s one remaining genuinely-authored dataset (§3 of the existing note already flags it as the strongest candidate for an eventual OECB `alignments/` RFC) — authoring it in YAML now removes a format-conversion step from that future migration and matches every other hand-authored dataset in the ecosystem. |
| `openevo-graph/edges/edges.json` | Hand-authored JSON | Splits along the same line as the nodes above: the portion describing content-anchor/thinking-tool/crosswalk relations converts to YAML alongside them; edges purely between retired competency/concept nodes are moot. |
| `ccs-graph/nodes/**/*.json`, `ccs-graph/edges/*.json` | Hand-authored JSON | **Convert to YAML.** `ccs-graph` keeps its own distinct job indefinitely (§4 of the existing note) — this is permanent hand-authored content, not a migration candidate, so there's no "it'll get replaced anyway" argument against converting it. |
| `ccs-graph/schema/relation.schema.json` and equivalent node schemas | JSON Schema | Schemas stay JSON Schema regardless of source-data format — this matches OECB's own convention (`schemas/*.schema.yaml` are YAML-wrapped JSON Schema, but the underlying schema language is unchanged). Converting `ccs-graph`'s schemas to the `.schema.yaml` wrapper OECB uses is a small, optional consistency win, not a requirement. |

**Migration mechanics:** a one-time conversion script (`yaml.dump` over the parsed JSON, hand-reviewed for the inevitable key-ordering/comment losses a mechanical conversion causes) per file, committed as an ordinary PR, not an RFC — this is a format change to already-local, non-OECB-governed data, so it doesn't touch OECB's `proposals/` review queue at all and can happen independently of, and in parallel with, the RFC-gated migration work in the existing note.

## 3. RDF and SPARQL: why, when, and why not here

Answering the "why would this even help" part of Dustin's question directly, since it wasn't explained anywhere in the ecosystem before now:

RDF/SPARQL earns its cost exactly once you need **relational queries across independently-authored vocabularies** — "every concept aligned to X, across every vocabulary and alignment record, regardless of which repo defined it." A flat JSON index (id → record lookup) handles everything else — simple validation, single-record resolution, a client-side graph visualization — without needing a triple store at all. This is precisely why OECB's own spec scopes RDF/JSON-LD + a SPARQL endpoint (Oxigraph or hosted equivalent) to **Phase 4**, not Phase 1: it's real infrastructure, justified only once there's more than one vocabulary and alignments actually need to be queried, not just listed.

**Recommendation: neither `openevo-graph` nor `ccs-graph` should build its own RDF pipeline.**

- Content that migrates into OECB (content anchors, thinking tools, and eventually the CASE crosswalk as an `alignments/` RFC) **inherits OECB's RDF/SPARQL layer automatically**, once OECB builds it — that's the entire point of migrating rather than maintaining a parallel copy.
- Content that stays local — `openevo-graph`'s crosswalk-exploration app, `ccs-graph`'s CCS-field graph — is consumed by a client-side JS graph viewer (`ccs-graph`'s own planned Explorer, per `ccs-graph/docs/ccs-graph_plan.md` §IV) reading flat YAML/JSON directly. That consumption pattern has no relational-query need a SPARQL endpoint would serve; building one would be infrastructure with zero consumers.

If a genuine cross-vocabulary query need shows up later — e.g., "find every CCS-graph relation record touching a concept that's also in an OECB alignment" — the right move at that point is extending OECB's Phase 4 SPARQL endpoint to also load `ccs-graph`'s YAML as an additional named graph, not standing up a second, disconnected triple store.

## 4. Shared design tokens

Per Dustin's confirmed answer, scope stays deliberately small: **design tokens only** (colors, spacing, type scale, radii, dark-mode variables as CSS custom properties) — not a full component library, not enforced markup/JS, just the `:root` block every app already hand-copies.

**What it looks like:** a new `openevo-graph/design-system/tokens.css` containing exactly the `:root` / `@media (prefers-color-scheme: dark)` / `:root[data-theme="dark"]` block already shared verbatim between `conceptbase/app/css/styles.css` and `lab_manager/app/css/styles.css` today (see §1) — extracted, not redesigned, so this is a zero-risk consolidation of something already visually agreed on, not a new design exercise. Each app's own `styles.css` keeps its layout/component rules and simply stops redeclaring the token block.

**Delivery mechanism** (the part that needs deciding, since these are separate, currently-buildless static-HTML repos on separate GitHub Pages deployments): reference the token file by its pinned GitHub Pages URL —

```html
<link rel="stylesheet" href="https://openevo-ccs.github.io/openevo-graph/design-system/tokens.css">
```

— the same no-build-step, static-file consumption pattern every one of these apps already uses for everything else. This requires `openevo-graph` to have its own GitHub Pages deploy (it doesn't yet; `conceptbase` and, implicitly, `lab_manager` do). Version pinning (a tag or commit SHA in the URL instead of `main`) is worth doing once more than one app depends on it, so a future token change doesn't silently reflow every consumer's page simultaneously — but isn't needed for the first two consumers while this is still being proven out.

**Consumers, in order:** `conceptbase/app`, `lab_manager/app` (both switch from hand-copied tokens to the shared file — a pure deletion of duplicated lines, no visual change), then whatever exploration app `openevo-graph` itself ends up building per the existing design note's §3 item 2, then optionally `OpenCASE`'s editor (a heavier React app with its own build step — lower priority, since it doesn't share the duplication problem the two static apps have today).

## 5. WordPress ingestion

**Scope, per Dustin's confirmed answer:** `teachingbase` and `projectbase` only, for now. The other six custom post types found live (`conceptbase`, `questionbase`, `methodsbase`, `literaturebase`, `domainbase`, `events`) are real and do overlap with governed ecosystem content — `literaturebase` with `ccs-graph`'s literature nodes, WordPress's own `conceptbase` with OECB's `oe:Concept` — but are explicitly out of scope for this pipeline and not being investigated as an urgent side-track either; they're a known-and-logged gap for a later note, not a silent omission.

**Governance, per Dustin's confirmed answer:** a **read-only raw cache**, no auto-merge into any governed node. Because the WordPress content and the GitHub ontology evolved independently (§1), there is no reliable ID/slug correspondence to auto-reconcile against yet — building auto-merge logic now would mean guessing at a mapping that hasn't been verified, which is a worse failure mode than doing the reconciliation by hand.

**Concretely:**

- New directory `openevo-graph/wordpress-sync/` (or a dedicated `openevo-graph/scripts/wordpress_sync.py` writing into it), holding one dated raw JSON snapshot per post type per run — `teachingbase-2026-07.json`, `projectbase-2026-07.json` — paginated via `?per_page=100&page=N` against the public REST endpoints confirmed live and reachable without authentication:
  - `https://openevo.eva.mpg.de/wp-json/wp/v2/teachingbase`
  - `https://openevo.eva.mpg.de/wp-json/wp/v2/projectbase`
- **Nothing in this directory is hand-edited or treated as authoritative** — it's a mirror, git-tracked so drift over time is diffable (a real, incidental benefit: `git log` on this directory becomes a changelog of what changed on the live site between scrapes), but explicitly excluded from `openevo-graph`'s own schema validation and from any OECB RFC eligibility until a human has looked at it.
- **Reconciliation is a separate, human step**, not part of the sync job: periodically (not necessarily monthly — decoupled from the scrape cadence), someone diffs the latest `wordpress-sync/teachingbase-*.json` against `openevo-graph`'s own taxonomy files (`metadata/subject_areas.json`, `metadata/grade_bands.json`) and OECB's vocabularies, and decides case by case whether an entry represents a genuinely new resource worth an OECB `oe:Resource`/`oe:Practice` entry (both reserved, per the existing note §3, but undefined until a later OECB phase — so today the honest answer is "logged in the mirror, revisited once that class exists"), a duplicate, or nothing worth tracking.
- **Scheduling** follows the exact pattern already established by `lab_manager/scripts/daily_scan.ps1` for `git_health.py`: a small PowerShell wrapper (`openevo-graph/scripts/monthly_wordpress_sync.ps1`) that runs the Python sync script, logs to a local (gitignored) log directory, and is registered as a monthly Windows Scheduled Task — reusing infrastructure that already exists rather than inventing a second scheduling mechanism. `lab_manager`'s daily health report gains one new tracked field (`wordpress_sync_last_run`, `wordpress_sync_new_entries_since_last`) the same way it already tracks `openevo_graph_migration`, giving ecosystem-wide visibility into whether the sync is actually running without needing a separate dashboard.
- **Licensing is an open question, not a design choice** — the same category as the `FAIR_Curriculum.md` publication-status question the prior note flagged and Dustin resolved directly. `openevo.eva.mpg.de`'s content license (whether TeachingBase/ProjectBase entries are openly licensed in a way compatible with OECB's CC-BY-NC-SA-4.0, or with any redistribution at all) hasn't been checked — needs an explicit answer before any scraped content moves past the private raw-mirror stage into anything OECB-facing or public-facing. Safe default until answered: treat the mirror itself as private/internal (gitignored or in a private repo, not published to `openevo-graph`'s public GitHub Pages), even though the source API is publicly reachable without authentication.

## 6. How this weaves into the existing plan

Extending the existing note's diagram (§5) with what this note adds — new pieces marked `+`:

```
   curriculum-evolution                                    ccs-graph  (+ now YAML-authored)
   theory (the Manual) · methods                    graph of the CCS field itself
              │                                              │
              ▼                                              │
   ┌───────────────────────────────────────────────┐          │
   │        conceptbase — OpenEvo Concept Base       │◄────────┘
   │  YAML authoring → compiled JSON/RDF (Phase 4)   │
   │  + proposed: oe:ContentAnchor / oe:ThinkingTool  │
   └───────────────────────────────────────────────┘
        │            │            │            │
        ▼            ▼            ▼            ▼
  bio-core-k12   oe-interdisc-  openevo-graph   OpenCASE
  (LPM)          k12 (LPM)      (+ YAML crosswalk data
                                 + design-system/tokens.css
                                 + wordpress-sync/ raw mirror)
        │            │            │            │
        └────────────┴──────┬─────┴────────────┘
                             ▼
                     curriculum-agents
                             │
                             ▼
                        lab_manager
       (+ tracks wordpress_sync status alongside openevo_graph_migration;
        scheduling infra reused, not duplicated, for the monthly sync job)
```

The design-tokens file is the one new artifact consumed *sideways* rather than downward — `conceptbase/app` and `lab_manager/app` both pull from `openevo-graph`, which doesn't otherwise sit upstream of either in the content-governance sense. That's fine; it's a presentation-layer dependency, not a data-governance one, and doesn't need to route through OECB at all.

## 7. Execution sequence

Ordered by independence — each of these four workstreams can start immediately and in parallel, none blocks on `eva4k12`'s Open Decision 6 the way the existing note's RFC-gated work does, because none of this touches OECB's `proposals/` review queue:

1. **YAML conversion** (§2) — mechanical, low-risk, one PR per repo. Do this first since it's the cheapest and makes every subsequent contribution to either repo follow the right convention from day one.
2. **Extract `design-system/tokens.css`** (§4) — a pure refactor of already-agreed-on values; do second, since `conceptbase`/`lab_manager` benefit immediately with no visual change and no new decisions required.
3. **Stand up `wordpress-sync/`** (§5) — new capability, needs the licensing question answered first (flagged above) before anything beyond a private/internal mirror is safe to build. Draft the sync script and scheduling wrapper in parallel with getting that answer; gate making the mirror public or OECB-facing on it.
4. **Reconciliation pass** (§5) — deliberately *not* scheduled yet. First run of the sync job produces the first real dataset to reconcile against; decide the reconciliation cadence once there's actual data in hand to judge how much drift/overlap there is, rather than guessing at a schedule now.

None of this is urgent relative to `eva4k12`'s KoMet-grant-runway deadline (per the existing note's §9.5) — same "lower-urgency housekeeping that happens to be high-value" category.

## 8. Progress

**2026-07-23 — same day as the strategy pass, all three parallel workstreams started per Dustin's go-ahead:**

- **YAML conversion (§2) — done**, content unchanged, format only, verified against the live repos (nothing in `curriculum-agents` reads these files programmatically, so no consumer breaks): `openevo-graph/nodes/case_frameworks.json`, `case_standards.json`, `metadata/crosswalk_index.json`, and `edges/edges.json` converted to `.yaml`; all of `ccs-graph`'s hand-authored nodes/edges converted the same way. `openevo-graph/README.md`/`CONTRIBUTING.md` and `ccs-graph/CONTRIBUTING.md` updated to reference the new filenames and state the YAML convention going forward. **One pre-existing issue surfaced, not fixed:** `ccs-graph/nodes/technological/vector-database.json` was a 0-byte stub (not valid JSON) — left as-is rather than fabricating content; still needs either real content or deletion.
- **`design-system/tokens.css` (§4) — extracted**, byte-identical token values, into `openevo-graph/design-system/` (plus a `README.md` documenting scope/usage/provenance) and `openevo-graph/.github/workflows/pages.yml` added (mirrors `conceptbase`'s deploy workflow) so it can serve over GitHub Pages once pushed. `conceptbase/app/css/styles.css` and `lab_manager/app/css/styles.css` had their duplicated `:root` token blocks removed in favor of a `<link>` to the shared stylesheet in each `index.html`.
  - **Real sequencing risk, not yet resolved:** `openevo-graph` has no live GitHub Pages deploy yet (this is its first `.github/workflows/`), and the two consuming apps' `<link>` tags now point at `https://openevo-ccs.github.io/openevo-graph/design-system/tokens.css`, which won't resolve until `openevo-graph` is pushed **and** its repo's Pages source is set to "GitHub Actions" (Settings → Pages → Source — the same one-time manual step `conceptbase`'s own README notes it needed). **Do not push `conceptbase`'s or `lab_manager`'s changes ahead of `openevo-graph`'s Pages deploy going live**, or both public sites will briefly render unstyled.
- **WordPress sync (§5) — built and smoke-tested against the live site, not yet scheduled.** `openevo-graph/scripts/wordpress_sync.py` (+ `requirements.txt`) paginates the public, unauthenticated `teachingbase`/`projectbase` REST endpoints and writes dated snapshots to `wordpress-sync/{post_type}/`; `scripts/monthly_wordpress_sync.ps1` wraps it following `lab_manager/scripts/daily_scan.ps1`'s exact pattern (log rotation included) but is **not** registered as an actual Windows Scheduled Task yet — that's a deliberate, separate step. First real run (2026-07-23) pulled 226 `teachingbase` entries (2.2 MB) and 46 `projectbase` entries (364 KB) successfully. Licensing confirmed by Dustin Eirdosh (content owner) as CC-BY-NC-SA-4.0, matching the rest of the ecosystem — the mirror is git-trackable/public, not gated to a private cache as the draft's safe-default had assumed.
- **Not yet done:** registering the monthly Scheduled Task; the first reconciliation pass against OECB/`openevo-graph` taxonomies (deliberately deferred — see §7 item 4); confirming `openevo-graph`'s Pages deploy is live before pushing the two dependent apps' changes; a decision on the 0-byte `vector-database.json` stub.
