# Design Concept, Governance, Contribution, and Management Plan for `openevo-graph` and `ccs-graph`

| | |
|---|---|
| **Project** | Define what `openevo-graph` and `ccs-graph` should *become* now that `conceptbase`, `curriculum-evolution`, `curriculum-agents`, and `lab_manager` exist — none of which existed in their current governed form when these two repos were first authored — and propose a design concept, governance model, contribution process, and management/migration plan for each, plus how both weave into the full OpenEvo CCS Lab vision. |
| **Relationship to existing work** | Directly parallels `lab_manager/docs/design-notes/eva4k12-consolidation-and-grant-poc-strategy.md` — same situation (rich, pre-governance content repo; real value; no RFC discipline), same recommended treatment (triage what's genuinely novel vs. superseded, propose RFCs for the former, retire/reconcile the latter, archive only once verified, never hard-delete). Builds on `conceptbase/GOVERNANCE.md` (RFC process, sandbox tier, versioning) and `conceptbase/CONTRIBUTING.md`, `curriculum-evolution/CONTRIBUTING.md` (the lightweight non-RFC discipline), and `lab_manager`'s git-health scanner and dashboard plan. |
| **Document status** | **Strategy resolved 2026-07-22** (§9-10) — every design choice raised in the original draft now has a committed position and rationale, except one genuine external fact (`ccs-graph/docs/FAIR_Curriculum.md`'s real-world publication status, §10) that only Dustin can supply; a safe default is specified for it in the meantime. §11 (Progress) records what's been executed same-day. |
| **Author** | Claude (planning pass), for review by Dustin Eirdosh |
| **Date** | 2026-07-22 |

## Table of Contents

1. [Why this, why now](#1-why-this-why-now)
2. [The ecosystem as it actually stands today](#2-the-ecosystem-as-it-actually-stands-today)
3. [`openevo-graph` — what it is, and what it should become](#3-openevo-graph--what-it-is-and-what-it-should-become)
4. [`ccs-graph` — what it is, and what it should become](#4-ccs-graph--what-it-is-and-what-it-should-become)
5. [How it all weaves together](#5-how-it-all-weaves-together)
6. [Governance concept](#6-governance-concept)
7. [Contribution concept](#7-contribution-concept)
8. [Management concept](#8-management-concept)
9. [Resolved strategy and execution sequence](#9-resolved-strategy-and-execution-sequence)
10. [The one open call](#10-the-one-open-call)
11. [Progress](#11-progress)

---

## 1. Why this, why now

`openevo-graph` and `ccs-graph` are the ecosystem's two oldest data repositories. Both were created 2026-06-08, both had almost all of their real content authored within days of that (`openevo-graph`'s last substantive commit is 2026-06-08; `ccs-graph`'s content commits run 2026-06-08 through 2026-06-24). Neither has an RFC process, neither validates against a shared schema in CI, and `openevo-graph` has had zero governance attention (no `CONTRIBUTING.md`, no `.gitignore`) even during this week's ecosystem-wide governance sweep that touched `conceptbase`, `curriculum-evolution`, `lab_manager`, and (lightly — a `CONTRIBUTING.md` and `.gitignore`, 2026-07-22) `ccs-graph` itself.

This is exactly the situation `eva4k12` was found to be in a few hours before this note was written: **real, substantial content that predates this ecosystem's RFC/schema governance, now sitting next to infrastructure (`conceptbase`, `curriculum-evolution`, `curriculum-agents`) that has since matured around it.** The eva4k12 note's diagnosis applies here almost verbatim: "It didn't grow because it was never plugged into the machinery... that lets content in this ecosystem compound instead of sitting still." The difference is that `eva4k12` was a single-purpose K-12 content project that could be fully absorbed elsewhere. `openevo-graph` and `ccs-graph` are not that simple — each contains one part that genuinely has no other home in the ecosystem, and one part that is now redundant with something built later. The job of this note is to say which is which for each repo, not to recommend wholesale retirement.

## 2. The ecosystem as it actually stands today

Verified by direct read of every sibling repository under `D:\dev\openevo-ccs-lab`, not summary:

| Repo | Role | Governance today |
|---|---|---|
| `curriculum-evolution` | Theory: the *GitHub Manual for Curriculum Evolution* + generalized methods. No runtime code, mints no identifiers. Explicitly reconciled chapter-by-chapter against OECB (Ch. 19). | Lightweight — `CONTRIBUTING.md` only, no RFCs, by design |
| `conceptbase` (OECB) | The semantic backbone: ontology (`oe:Concept`, `oe:LPM`, `oe:Strand`, `oe:SubStrand`, `oe:LearningObject`, `oe:Competency`; reserved `Collection`/`Assessment`/`Practice`/`Evidence`/`Resource`), JSON Schemas, controlled vocabularies, the `www.w3id.org/openevo/` identifier registry. Infrastructure, not content. | Full RFC process (`GOVERNANCE.md`), semver per artifact, w3id-registered |
| `w3id.org` | Hosts the actual namespace redirect entry for `/openevo/` | Upstream community repo (`perma-id/w3id.org`), not lab-governed |
| `bio-core-k12` | Reference LPM — single-vocabulary (`BIO-CORE`), decentralized-causation framing | RFC-dependent (consumes OECB), own `validate.yml` |
| `oe-interdisciplinary-k12` | Reference LPM — multi-vocabulary (`OE-INTERDISCIPLINARY`), agency-inclusive framing; absorbing `eva4k12`'s content | Same |
| `eva4k12` | Being retired/archived — concept-layer content migrated into OECB (RFC-0012), strand-layer migration still open | In wind-down, per the sibling design note |
| `curriculum-agents` | The multi-agent runtime — agents/skills/processes/tools implementing `curriculum-evolution`'s deliberation protocol; the actual `conceptbase_*` MCP tools this session's agents use | In development toward public release |
| `OpenCASE` | General-purpose CASE (1EdTech) authoring/publishing platform — visual editor, publishing server, IAM | Its own product, not OpenEvo-specific |
| `lab_manager` | Ecosystem health monitoring, git-health scanner, public dashboard, Lab Journal, cross-repo consolidation coordination | Its own design-notes discipline |
| `EvoMentor` / `EvoMentor_DE` | Applied digital tools for integrating evolution into biology teaching (EN/DE) | Project-level, MIT |
| `KoMet` | Grant-proposal planning space (BMBFSFJ) — points at `conceptbase`/`curriculum-agents`/`EvoMentor_DE` as its real infrastructure | Planning repo, not infra |
| `eva_buch` | Data + interactive app backing a specific Springer publication (Hanisch 2027) | Project-level |
| **`openevo-graph`** | Hand-authored graph of **OpenEvo's own design concept** (9 content anchors, 6 thinking tools, 15 competencies, 24 concepts, 2 teachingbase resources) plus CASE framework/standard crosswalk data (NGSS, CCSS, C3, CASEL, CSTA, SHAPE America, NHES) | **None** — no `CONTRIBUTING.md`, no schema validation, no RFCs, untouched since 2026-06-08 |
| **`ccs-graph`** | Hand-authored graph of **the CCS research field itself** (computational methods/measures, curricular theory, people, literature, technological nodes) — explicitly distinct from `conceptbase`, which governs curriculum *content* | Partial — a real, specific `CONTRIBUTING.md` (added 2026-07-22) but no schema CI, and a README that is still the unfilled placeholder template |

The pattern: everything built *after* mid-June (`conceptbase`, `curriculum-evolution`, `curriculum-agents`, `lab_manager`) has real governance. Everything built *in* that first week (`openevo-graph`, `ccs-graph`, `eva4k12`) doesn't, because the governance machinery didn't exist yet when they were written. `eva4k12` is already being brought into the fold. This note proposes the same for the other two — but their content shape means the right destination is different for each.

## 3. `openevo-graph` — what it is, and what it should become

### What's actually in it (verified by direct read)

| Asset | File(s) | Real content? | Governed elsewhere? |
|---|---|---|---|
| 9 Content Anchors | `nodes/content_anchors.json` (610 lines) | Yes — full descriptions, grade-band progressions K-2 through 13-16, CASE links, related-anchor edges | **No.** `oe:ContentAnchor` does not exist as an OECB class. This is the *only* machine-readable, structured representation of OpenEvo's signature 9-anchor design-concept model anywhere in the ecosystem. |
| 6 Thinking Tools | `nodes/thinking_tools.json` (486 lines) | Yes — category, scaffolding level, application context | **No.** Same gap — `oe:ThinkingTool` doesn't exist either. |
| 15 Competencies | `nodes/competencies.json` (1,130 lines) | Yes — domain, developmental progression, assessment approaches | **Yes, structurally.** `oe:Competency` is a stable OECB class (RFC-0002), with its own vocabularies (`NGSS-LIFE-SCIENCE`, `AI4K12`, `DIGCOMPEDU`, `UNESCO-AI-CFT`, `KMK-DIGITALE-WELT`, `CCC`). This repo's 15 competencies are a parallel, non-interoperable duplicate — no shared IDs, no `oe:` prefix, no vocabulary registration. |
| 24 Concepts | `nodes/concepts.json` (1,755 lines) | Yes — scope, misconceptions, exemplar questions | **Yes, structurally.** Same situation as competencies — `oe:Concept` already exists and is exactly this. |
| 2 Teachingbase resources | `nodes/teachingbase.json` (262 lines) | Thin — only 2 entries | **Partially.** OECB reserves `oe:Resource`/`oe:Practice` for exactly this, undefined until a later phase. |
| CASE framework/standard crosswalk | `nodes/case_frameworks.json` (662 lines), `nodes/case_standards.json` (1,877 lines), `metadata/crosswalk_index.json`, `oe-graph-crosswalk.md` | Yes, and substantial — real alignments to NGSS, CCSS Math/ELA, C3 Framework, CASEL, CSTA, SHAPE America, NHES across all 9 anchors | **Anticipated, not yet built.** This is exactly OECB Phase 3/4 scope ("CASE/LOM/xAPI profile mappings," "alignments/") arriving early, unreviewed, and outside the registry. |
| 1,552-line edge graph | `edges/edges.json` | Yes — typed, weighted (`enables`/`grounds`/`precursor to`/`aligns to`/etc.) relations across all of the above | No equivalent in OECB today (alignment records exist, but not this general-purpose weighted-edge model) |
| Grade-band & subject-area schemas | `metadata/grade_bands.json`, `metadata/subject_areas.json` | Yes, rich, OpenEvo-specific pedagogical framing per band/subject | Reserved for OECB Phase 3 ("multiple grade-band schemas... multiple subject-area taxonomies") but not yet built there |

**The honest read:** two of `openevo-graph`'s five node types (`competency`, `concept`) are pure duplication of something OECB already governs better. One (`teachingbase`) is thin and anticipates a reserved-but-undefined OECB class. But **two of its five node types (`content_anchor`, `thinking_tool`) are load-bearing for the whole ecosystem and exist nowhere else** — the `content-anchor-mapper` and `thinking-tools-kit` skills, and the `design-concept-coach`/`curriculum-architect`/`dbr-cycle-facilitator` agents, all operate on OpenEvo's 3-principles/9-anchors/6-tools design concept as bedrock vocabulary, yet that vocabulary's only structured representation is sitting ungoverned in this repo. And the CASE crosswalk is real, valuable, and not duplicated anywhere — it's simply unreviewed and pre-empts work OECB has scoped for later phases.

### What it should become

**Design concept:** `openevo-graph` stops trying to be a second, competing ontology for things OECB already governs (`Concept`, `Competency`), and becomes two things instead, mirroring the split that already exists between `conceptbase` (registry) and `conceptbase/app` (explorer):

1. **The source vocabulary for OpenEvo's own design concept.** Content anchors and thinking tools get proposed as new OECB classes (or, following the RFC-0012 precedent that just resolved cross-cutting themes as tagged `oe:Concept` entries rather than a new class, as an `extensions["oe:conceptRole"]`-tagged `oe:Concept` subset — see §10 item 1 for why this is a real choice, not a foregone one). Either way, the 9+6 nodes migrate into a governed OECB vocabulary via RFC, the same path `eva4k12`'s concepts just took (RFC-0012).
2. **The graph-native exploration and standards-crosswalk application** for the whole ecosystem — an educator- and researcher-facing tool answering "how does OpenEvo's design concept map onto NGSS / CCSS / C3 / CASEL / my state standards," reading from the OECB registry (once the vocabulary migrates) plus its own CASE crosswalk data, rather than hand-maintaining a shadow copy of concepts and competencies OECB already owns. This is genuinely complementary to `conceptbase/app`'s registry explorer, not a competitor to it — that app answers "what does this concept mean and what aligns to it across the whole registry"; this one answers "how does OpenEvo's pedagogical model translate into a specific jurisdiction's standards," which is a different, real, unmet need.

The CASE crosswalk content itself is the strongest candidate to become an actual RFC contribution to OECB's Phase 3/4 alignment work (`alignments/`) — it's more complete, for more frameworks, than anything currently in `conceptbase/alignments/`.

## 4. `ccs-graph` — what it is, and what it should become

### What's actually in it (verified by direct read)

| Asset | File(s) | Real content? | Overlaps with |
|---|---|---|---|
| Node categories: `ccs_core`, `computational`, `curricular`, `literature`, `people`, `technological` | `nodes/*/` | Structure exists; sparse instance data so far | Nothing else in the ecosystem models the CCS research field itself as a graph — this is genuinely unique |
| One populated edge record | `edges/entropy-shannon--learning-progressions--meso--001.json` | Yes, but only one — a worked example, not a populated graph yet | — |
| A rich relation schema (multi-scale tagging, tiered prose, confidence blocks, literature citations) | `schema/relation.schema.json` | Yes, genuinely well-designed per its `CONTRIBUTING.md`'s own description | No equivalent schema exists elsewhere in the ecosystem |
| A real backlog of candidate computational measures | `data_development.csv` | Yes — pre-written relevance statements for measures like Shannon entropy, mutual information | Unique to this repo |
| **Five long-form docs reading as draft theory/position papers** | `docs/curriculum_evolution_theory.md`, `docs/ccs_scientific_principeles.md` (sic), `docs/ccs_scientific_principles_v2.md`, `docs/FAIR_Curriculum.md`, `docs/case_models_ccs.md` | Yes, substantial | **Overlaps heavily.** `curriculum_evolution_theory.md` and the `ccs_scientific_principles` v1/v2 pair read as earlier drafts of exactly the theoretical ground `curriculum-evolution`'s Manual now covers in curated, versioned form (and that repo's README already states "FAIR is the throughline... [OECB's] design principles turn out to be the concrete, engineering-level expression of this manual's abstract theoretical commitments" — i.e. `FAIR_Curriculum.md`'s entire thesis). `case_models_ccs.md`'s CASE-as-graph-ontology analysis is directly relevant to `OpenCASE` and to OECB's own CASE-profile work (RFC-0002, `docs/design-notes/case-competency-profile.md`) but currently sits disconnected from both. |

The repo's own `docs/ccs-graph_plan.md` already says its structure "needs to be updated for integration within the CCS Lab repository" — this isn't a new external diagnosis, the repo has been flagging its own provisional state since 2026-06-09. Its `CONTRIBUTING.md` (added just this week, 2026-07-22) already draws the one distinction that matters most: this is a graph *about the research field* (methods × theory × people × literature), while `conceptbase` governs curriculum *content*. That distinction is correct and worth keeping — nothing else in the ecosystem does this job.

### What it should become

**Design concept:** `ccs-graph` keeps its distinct, genuinely unique job — **a living, citation-backed knowledge graph of Computational Curriculum Studies as a research field**: the computational methods and measures the field draws on, the people and literature that constitute it, and how curricular-theory nodes relate to them — and becomes the graph-native companion to `curriculum-evolution`'s prose Manual, the same relationship `openevo-graph` should have to OECB's registry. Where `curriculum-evolution` argues the theory in prose, `ccs-graph` should let you query it: "what computational measures have been proposed for what curricular phenomena, with what confidence, citing what literature."

Its five draft docs should be triaged, not silently kept as duplicate ground truth:
- `curriculum_evolution_theory.md` and both `ccs_scientific_principles` drafts — reconcile against `curriculum-evolution`'s current Manual chapters; where superseded, replace with a pointer to the canonical chapter (the same "point at the successor, don't just delete" discipline the eva4k12 note used for its own retired content); where they contain something the Manual doesn't yet have, that's a genuine contribution to propose *into* `curriculum-evolution` instead.
- `FAIR_Curriculum.md` — this looks like an actual submittable *Journal of Curriculum Studies* perspectives-article draft (it has an abstract, a journal name in the header). Worth confirming its publication status with you directly rather than assuming it's just internal working material (see §10 item 4).
- `case_models_ccs.md` — genuinely relevant to two other repos (`OpenCASE`, and OECB's CASE-competency-profile design note) that didn't exist when it was written. Worth cross-linking or migrating relevant analysis into `conceptbase/docs/design-notes/case-competency-profile.md` rather than leaving the connection undiscoverable.

## 5. How it all weaves together

```
   curriculum-evolution                                    ccs-graph
   theory (the Manual) · methods                    graph of the CCS field itself
   no runtime code, mints no IDs                (methods/measures · people · literature)
              │                                              │
              │  reconciled against, and informs   reconciled against, and informs
              │  (Ch. 19: "The OpenEvo Instantiation")        │
              ▼                                              │
   ┌───────────────────────────────────────────────┐          │
   │        conceptbase — OpenEvo Concept Base       │◄────────┘
   │  FAIR ontology · schemas · controlled vocabularies
   │            www.w3id.org/openevo/                │
   │  + proposed: oe:ContentAnchor / oe:ThinkingTool  │
   │       vocabulary, sourced from openevo-graph      │
   └───────────────────────────────────────────────┘
        │            │            │            │
        ▼            ▼            ▼            ▼
  bio-core-k12   oe-interdisc-  openevo-graph   OpenCASE
  (LPM)          k12 (LPM)      (design-concept  (CASE
                                 vocab source +   authoring/
                                 standards-       publishing)
                                 crosswalk app)
        │            │            │            │
        └────────────┴──────┬─────┴────────────┘
                             ▼
                     curriculum-agents
           (the runtime: agents · skills · tools · processes
            that actually query conceptbase and act on all of this)
                             │
                             ▼
                        lab_manager
          (health monitoring, dashboard, cross-repo consolidation —
           the same coordinating role it's already playing for eva4k12)
```

Read top to bottom: theory exists in two forms (prose in `curriculum-evolution`, graph in `ccs-graph`) that both feed the same governed semantic backbone (`conceptbase`). That backbone is consumed by content instances (the LPM repos), by standards tooling (`OpenCASE`), and — once its own design-concept vocabulary migrates there — by `openevo-graph`, which keeps its own genuinely unique second job as the standards-crosswalk exploration app. `curriculum-agents` is the runtime that actually acts on all of it (including, in this very session, via the `content-anchor-mapper`/`thinking-tools-kit`/`design-concept-coach` skills and agents that currently depend on `openevo-graph`'s ungoverned data being *right*, even though nothing currently guarantees it is). `lab_manager` watches the whole thing for drift and coordinates exactly this kind of cross-repo consolidation — it already has the playbook, from `eva4k12`.

## 6. Governance concept

Neither repo should adopt OECB's full RFC apparatus wholesale — that machinery exists because OECB mints *permanent, never-deleted* identifiers that other repositories pin against, and that's a heavier guarantee than either repo actually needs to make on its own. The right model for both is closer to `curriculum-evolution`'s deliberately lightweight discipline, plus one thing neither of them has yet: an explicit boundary between "content that should become an OECB RFC" and "content that stays local."

**Proposed roles (both repos):**

| Role | Responsibility |
|---|---|
| **Maintainer** | Merge rights; decides when a change should instead be redirected to an OECB RFC; cuts the (rare) versioned releases of exported/generated artifacts |
| **Contributor** | Anyone; opens PRs for data, schema, or (for `openevo-graph`) app changes |

**Proposed process (both repos):**

1. **Data changes** (new node, new edge, new relation record) — ordinary PR + review against the repo's existing schema. No RFC needed *unless* the addition duplicates or contradicts something already governed by OECB (a new competency, a new concept) — in that case, the PR should be redirected to an OECB RFC instead of merged locally, exactly the boundary `eva4k12`'s migration drew.
2. **Schema changes** — issue-first, as `ccs-graph`'s own `CONTRIBUTING.md` already states ("the schema is shared infrastructure for every record in this repo, so a change needs to work for records that already exist, not just a new one"). `openevo-graph` should adopt the identical rule once it has a `CONTRIBUTING.md` at all.
3. **Anything proposed as a new OECB class or vocabulary** (the `oe:ContentAnchor`/`oe:ThinkingTool` question, §10.1) — goes through `conceptbase`'s real RFC process, authored jointly by whoever maintains `openevo-graph` and an OECB maintainer/domain editor, per `conceptbase/GOVERNANCE.md`.
4. **Versioning** — once either repo's canonical data has migrated to OECB, what remains locally (the crosswalk data, the field-graph) should version independently per artifact, OECB-style (semver on the schema, semver on any exported dataset), rather than a single repo-wide version number.

## 7. Contribution concept

Both `CONTRIBUTING.md` files should follow the shape already established by `conceptbase` and `ccs-graph` (which already has a good one): before-you-start orientation distinguishing this repo's scope from its neighbors, a proposing-a-change section, a validation step, licensing, and where to ask questions.

**For `openevo-graph` specifically** (currently has none — this is the most immediate, cheapest gap to close): a new `CONTRIBUTING.md` should state plainly, up front, that:
- New competencies or concepts are **not** accepted here — propose them as an OECB RFC instead, and link to `conceptbase/CONTRIBUTING.md`.
- New or corrected CASE-standard crosswalk entries **are** welcome here, and are also candidates for upstreaming into `conceptbase/alignments/` once that becomes the ecosystem's canonical home for alignment records.
- Content-anchor/thinking-tool edits are welcome here *today*, but contributors should know this vocabulary is slated for an OECB RFC (§10.1) — so structural changes made now should anticipate that migration rather than diverge further from what OECB's schema conventions would require.

**For `ccs-graph`:** its existing `CONTRIBUTING.md` is already good and mostly needs one addition — guidance on what to do when a proposed relation record's claim substantially overlaps `curriculum-evolution`'s Manual (redirect there) versus is genuinely novel field-mapping content (belongs here).

## 8. Management concept

`lab_manager`'s git-health scanner already checks every sibling repo for `README.md`/`CONTRIBUTING.md`/`LICENSE` presence and canonical-org remote — both repos currently show real, checkable gaps (`openevo-graph`: no `CONTRIBUTING.md`; both: templated/unfilled README `Overview` sections — `openevo-graph`'s still has literal `<One paragraph describing...>` placeholder text, `ccs-graph`'s entire README is the unfilled template). Closing those is cheap, immediate, and independent of every open decision below — it's the same "no reason to wait" category as the eva4k12 note's de-personalization fix.

For the larger migration (content-anchor/thinking-tool RFC, docs triage), recommend `lab_manager` track it exactly the way it's already tracking `eva4k12`: a small consolidation-tracking object in the daily health report (e.g. `openevo_graph_migration: { content_anchor_rfc_status, thinking_tool_rfc_status, crosswalk_upstreamed: bool, app_decision_made: bool }` and `ccs_graph_migration: { docs_triaged: 0/5, fair_curriculum_pub_status_confirmed: bool }`), surfaced on the dashboard the same way the eva4k12 checklist is planned to be. This is genuinely cross-repo work (`openevo-graph` → `conceptbase` RFC, `ccs-graph` docs → `curriculum-evolution`/`conceptbase`) — exactly what `lab_manager` is scoped to coordinate.

Neither migration should be treated as urgent relative to `eva4k12`'s (which is mid-flight and has a grant-runway deadline attached via KoMet). This is lower-urgency housekeeping that happens to be high-value: it removes two ungoverned, potentially-drifting data sources that several `curriculum-agents` skills already depend on being accurate.

## 9. Resolved strategy and execution sequence

Each design choice raised in the original draft has been checked against direct evidence — the actual RFC-0012 precedent, and (newly checked for this pass) `curriculum-evolution/docs/archive/`, which turns out to already be exactly the mechanism this situation needs. That evidence resolves five of the six former open decisions outright; only one (§10) is a real-world fact rather than a design choice, and stays open for that reason alone.

**9.1 — Content anchors and thinking tools become tagged `oe:Concept` entries, not new ontology classes.**

Checked both against the actual test RFC-0012 used for cross-cutting themes — "does any behavior this ecosystem needs (validation, registry building, relation traversal) actually depend on this being a distinct type?" — and the answer is no for either. `oe:Concept` already subclasses `skos:Concept`, already carries `citations[]`, `relatedConcepts`-equivalent `skos:related`, and — critically — RFC-0012 already established exactly the extension mechanism this needs: `extensions["oe:developmentalArc"]` for grade-banded progression content with no schema home, and `extensions["oe:conceptRole"]` for a tag distinguishing a concept subset without a schema change. Content anchors' `gradeProgression` maps directly onto the already-precedented `oe:developmentalArc` extension; thinking tools' `toolCategory`/`scaffoldingLevel`/`applicationContext` become a new but structurally identical `extensions["oe:thinkingToolMeta"]` block, following the same pattern. Both get `extensions["oe:conceptRole"]` values (`"content-anchor"`, `"thinking-tool"`) so tooling can filter them the way `"cross-cutting-theme"` already works for `EVA4K12-CONCEPTS`. This is a `content`-type RFC, not a `specification-amendment` — lighter review, one maintainer + one domain-editor approval, not full maintainer consensus.

**9.2 — The RFC is authored jointly**, the same way RFC-0012 credits both the source repo's content and OECB's maintainers. Whoever is acting as `openevo-graph` maintainer drafts it (content, migration script, extension shape); an OECB maintainer/domain editor reviews and approves, per the existing roles table in `conceptbase/GOVERNANCE.md`. No new role needs inventing.

**9.3 — `openevo-graph`'s hand-authored JSON becomes a generated mirror once the vocabulary migrates, not an ongoing hand-reconciled duplicate.** The whole point of migrating is to have one source of truth; keeping a second hand-authored copy "in sync" recreates the exact problem this note exists to fix (two ungoverned data sources, one of which several `curriculum-agents` skills already depend on). Post-migration, `nodes/content_anchors.json` and `nodes/thinking_tools.json` should be built by a script reading the OECB registry (the same shape as `conceptbase/scripts/build_registry.py`'s own output), not maintained by hand. The CASE crosswalk data (`case_frameworks.json`, `case_standards.json`, `crosswalk_index.json`) is different — it has no OECB home yet (Phase 3/4, not built) — so it stays hand-authored in `openevo-graph` until/unless it's upstreamed per §9.5's own RFC.

**9.4 — `ccs-graph`'s five docs get triaged using the pattern `curriculum-evolution/docs/archive/` already established**, not invented fresh. That folder already holds two superseded planning documents (`curriculum-evolution-plan.md`, `impact_overview.md`), each carrying a standardized blockquote header: what was superseded, by what, and an explicit "kept here for historical reference only; do not treat as current." Applying that same template:
- `curriculum_evolution_theory.md`, `ccs_scientific_principeles.md`, `ccs_scientific_principles_v2.md` — these are earlier drafts of ground `curriculum-evolution`'s Manual (Parts I-II, and Ch. 9/11 on FAIR-as-instantiation) now covers in curated, reconciled form. Recommend: copy them into `curriculum-evolution/docs/archive/` with the same archived-header treatment, replace `ccs-graph`'s copies with short pointers to the archived versions. This is a real cross-repo action (touches both repos) — see §11 for what's been done vs. what's still a proposal awaiting your go-ahead, since (unlike the README/CONTRIBUTING fixes) it changes another repo's content, not just this pair's.
- `case_models_ccs.md` — its CASE-as-graph-ontology analysis is directly relevant to two things that didn't exist when it was written: `OpenCASE` and `conceptbase/docs/design-notes/case-competency-profile.md`. Cross-linked from both rather than archived outright — it's still live, useful analysis, just was previously undiscoverable from either place that would benefit from it. **Done, see §11.**
- `FAIR_Curriculum.md` — confirmed by Dustin Eirdosh (2026-07-23) to be working notes, not a live submission (§10 is now resolved). Joins the archive-with-pointer group above. **Done, see §11.**

**9.5 — Sequencing relative to `eva4k12`/KoMet:** the cheap, decision-independent fixes (README content, `openevo-graph`'s `CONTRIBUTING.md`) happen now, in parallel with `eva4k12`'s in-flight work — they don't touch OECB's `proposals/` review queue at all, so there's no attention contention. The RFC-gated work (§9.1's content-anchor/thinking-tool vocabulary, §9.4's doc-archival cross-repo edits) is sequenced **behind** `eva4k12`'s still-open strand-layer migration (the current real blocker per that note's §9 item 6) — both would otherwise compete for the same limited maintainer/domain-editor review attention during the KoMet grant runway. Concretely: this note's RFC drafting starts once `eva4k12`'s Open Decision 6 (the strand-to-strand mapping) is resolved and that migration's execution is underway, not blocked on its full completion.

**Execution sequence, now unambiguous:**

1. ✅ **Now** — README `Overview`/ecosystem sections (both repos), `openevo-graph/CONTRIBUTING.md`. See §11.
2. **Next, once `eva4k12`'s Open Decision 6 lands** — draft the `oe:ContentAnchor`/`oe:ThinkingTool`-as-tagged-`oe:Concept` RFC in `conceptbase/proposals/`, per §9.1-9.2.
3. ✅ **Done, ahead of the RFC** — the `curriculum-evolution/docs/archive/` porting for `ccs-graph`'s four superseded theory docs (§9.4/§10 now both resolved), and the `case_models_ccs.md` cross-links. This didn't need to wait for step 2 since it's independent of the ontology-class question. See §11.
4. **Once the RFC lands** — run the migration script, verify against `scripts/validate.py`/`check_related_symmetry.py`, then switch `openevo-graph`'s content-anchor/thinking-tool JSON to generated-mirror status per §9.3.
5. **Only after 4 is verified** — evaluate upstreaming the CASE crosswalk into `conceptbase/alignments/` as its own RFC, and decide whether either repo's exploration-app layer gets built or deferred (don't build speculatively).

## 10. The one open call — resolved 2026-07-23

Every other question in the original draft was a design choice this note could resolve against ecosystem precedent. Exactly one was not a design choice but an external fact only Dustin could supply: was `ccs-graph/docs/FAIR_Curriculum.md` — headed *Journal of Curriculum Studies*, "Perspectives Article" — an active submission, or internal working material?

**Confirmed 2026-07-23: working notes, not a live submission.** It therefore joins the same archive-with-pointer treatment as `curriculum-evolution_theory.md` and the two `ccs_scientific_principles` drafts (§9.4) rather than being held out. Executed same day — see §11. No design choices remain open in this note; everything below is execution against the resolved strategy in §9.

## 11. Progress

**2026-07-22 — same day as the strategy pass:**

- **README fixes, both repos** — `openevo-graph/README.md`'s templated `<One paragraph...>` Overview and placeholder Features replaced with real content describing the two-job design concept (§3) and current ecosystem map (§2/§5); `ccs-graph/README.md`'s entirely-unfilled template replaced the same way, describing its role as the graph-native companion to `curriculum-evolution`'s theory (§4).
- **`openevo-graph/CONTRIBUTING.md` — created**, per §7's three rules (competencies/concepts redirect to an OECB RFC; CASE-crosswalk contributions welcome and upstream-candidates; content-anchor/thinking-tool edits welcome now but should anticipate the §9.1 migration shape).

**2026-07-23 — once §10 resolved:**

- **`curriculum-evolution/docs/archive/` — four docs ported**, copied verbatim (not retyped, to avoid transcription error — same discipline RFC-0012 used for its script-driven migration) with the standard archived-header treatment already established by `curriculum-evolution-plan.md`/`impact_overview.md` in that same folder: `curriculum_evolution_theory.md`, `ccs-scientific-principles-v1.md` (from `ccs_scientific_principeles.md`), `ccs-scientific-principles-v2.md`, and `FAIR_Curriculum.md`. Each header states what superseded it and points to the specific reconciled Manual chapter(s).
- **`ccs-graph/docs/` — the four ported originals replaced with short pointer stubs** linking to their new archive location and the superseding Manual chapters, so anyone who finds them via search or an old link lands somewhere current — the same "don't leave a dead end" discipline the eva4k12 note applied to its own retirement.
- **`case_models_ccs.md` — cross-linked, not archived** (still live, useful analysis): added a "still live" banner pointing to `OpenCASE` and `conceptbase`'s CASE-competency-profile design note, and added a matching "see also" line in `conceptbase/docs/design-notes/case-competency-profile.md` pointing back — both directions now discoverable.
- **`ccs-graph/docs/ccs-graph_plan.md`** — deliberately left untouched. It's this repo's own architecture/self-description doc, not a theory draft, so it wasn't in scope for this triage; its own "needs to be updated for integration" note is a separate, later task.
- **Not yet done, and not started without further sign-off:** the `oe:ContentAnchor`/`oe:ThinkingTool` RFC itself (§9.1, sequenced behind `eva4k12` per §9.5) is the only remaining item from this note's original scope.
