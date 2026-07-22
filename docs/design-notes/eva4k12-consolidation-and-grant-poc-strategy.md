# eva4k12 Consolidation into oe-interdisciplinary-k12, and lab_manager's Coordinating Role for the KoMet Proof-of-Concept Push

| | |
|---|---|
| **Project** | Retire `eva4k12` as a standalone repo, migrate/synthesize its actual content value into `oe-interdisciplinary-k12`, de-personalize the MPI-EVA-linked content that currently names individual researchers, and define `lab_manager`'s role coordinating this and other proof-of-concept work ahead of the KoMet Modul C proposal. |
| **Relationship to existing work** | Builds directly on `lab_manager/docs/design-notes/ecosystem-dashboard-and-health-monitoring-plan.md` (dashboard/Tier 1-2 architecture, GWDG-assisted-but-human-reviewed discipline) and `conceptbase/GOVERNANCE.md` (sandbox lifecycle, never-delete-at-accepted-tier policy). Directly informs `KoMet/Docs/KoMet_Grant_Strategy_and_Monitoring_Plan.md` §3 (proof-of-concept roadmap) and the Modul C draft's Forschungsstand/Arbeitsprogramm sections. |
| **Document status** | Strategy proposal — not yet RFC'd, not yet executed. Written for Dustin's review; several items below are explicit open decisions, not settled calls. |
| **Author** | Claude (planning pass), for review by Dustin Eirdosh |
| **Date** | 2026-07-22 |

## Table of Contents

1. [Why this, why now](#1-why-this-why-now)
2. [What's actually in eva4k12 — migration inventory](#2-whats-actually-in-eva4k12--migration-inventory)
3. [Schema fit: what maps cleanly, what needs an RFC](#3-schema-fit-what-maps-cleanly-what-needs-an-rfc)
4. [The de-personalization problem — and it's smaller than it looks](#4-the-de-personalization-problem--and-its-smaller-than-it-looks)
5. [Retiring eva4k12 itself](#5-retiring-eva4k12-itself)
6. [lab_manager's coordinating role](#6-lab_managers-coordinating-role)
7. [Phasing, sequenced to the grant runway](#7-phasing-sequenced-to-the-grant-runway)
8. [The grant narrative this produces](#8-the-grant-narrative-this-produces)
9. [Open decisions — need your call](#9-open-decisions--need-your-call)

---

## 1. Why this, why now

`eva4k12` was a good idea that found a real, rich shape (7 strands, 6 cross-cutting themes, 13 compression concepts, two working HTML apps, a real German regional crosswalk) but never got the governance discipline the rest of the ecosystem has — no RFC process, no schema versioning against `conceptbase`'s ontology, its own bespoke JSON shape instead of `oe:Strand`/`oe:Concept`, and (the specific thing you flagged) content in a sibling repo's sandbox fork that ties specific curricular claims to named MPI-EVA researchers rather than to the science itself. It didn't grow because it was never plugged into the machinery — RFC review, cross-vocabulary alignment, the registry — that lets content in this ecosystem compound instead of sitting still.

`oe-interdisciplinary-k12` is the right home: it already spans Biology + Social Studies + Computer Science, already uses `oe:Concept`/`oe:Strand` under real schema governance, and (unforced, discovered during the ecosystem survey) its own sandbox capstone already organizes around the same MPI-EVA seven-department taxonomy eva4k12 independently converged on. The convergence is real; the execution needs consolidating.

This matters for KoMet specifically because Modul C's argument is that OpenEvo's infrastructure demonstrates *governed coherence*, not just accumulated content. Two overlapping, ungoverned repos telling a fragmented version of the same evolutionary-anthropology-in-K-12 story is a weaker proof point than one, RFC-governed, properly attributed body of work. This consolidation is itself a proof-of-concept action, not just cleanup — see §8.

## 2. What's actually in eva4k12 — migration inventory

Verified by direct read, not summary:

| Asset | Location | Real content? | Destination |
|---|---|---|---|
| 7 Strands (STRAND.HBEC/HumOr/DLCE/DAG/CCP/EvoGen/PrimEvo) | `framework/eva4k12_v1_2/eva4K12_strands.json` | Yes — ~10,900 lines total across all framework files, K-12 grade-banded, real methodological lenses | New `oe:Strand`/`oe:SubStrand` entries in `oe-interdisciplinary-k12/strands/`, replacing (not sitting alongside) the current sandbox capstone |
| 6 Cross-Cutting Themes (incl. "Machine-Culture Coevolution") | `eva4K12_cct.json` | Yes, including the scientific-racism/history-of-science entry (§4 below is more specific about that one) | Likely `oe:Concept` entries tagged as cross-cutting (needs a schema decision — §3) |
| 13 compression concepts | `eva4K12_concepts.json` | Yes | `oe:Concept` entries, cross-walked to existing `BIO-CORE`/`OE-INTERDISCIPLINARY` where overlapping (e.g. Phylogeny, Culture) rather than duplicated |
| Objectives, scaffolding, edges files | `eva4K12_objectives.json`, `_scaffolding.json`, `_edges.json` | Yes | Objectives → `performanceIndicators[]` on the migrated strands; scaffolding/edges → `relations{}`/`contextAssumption` on strands, per RFC-0009's existing trajectory-variant mechanism |
| Regional Thuringia crosswalk (26 entries) | `regional/eva4k12_biologie_thuringia_de_v1.json` | Yes, and identically duplicated in `EvoMentor_DE/data/lernziele_gy78_evolution.json` | Stays as regional instance data, re-pointed at the migrated strand IDs; the `EvoMentor_DE` copy needs updating in lockstep so the two don't drift apart post-migration |
| 2 HTML explorer apps | `apps/` | Yes, real and functional (~6,600 lines combined) | Not directly portable (they read eva4k12's bespoke JSON shape) — either rebuilt against the migrated OECB-shaped data, or retired in favor of `conceptbase/app`'s existing explorer once the content lives there. Don't rebuild speculatively; decide after §3/§9. |
| Disaffiliation + sensitive-topic-protocol metadata | `eva4K12_strands.json` `eva4k12:meta` block | Yes — already states "does not represent, speak for, or claim endorsement from any research institution" and has real protocols for genetics-and-race, WEIRD-bias, indigenous-knowledge content | Carry forward as-is into the migrated content's own governance notes — this is exactly the discipline you're asking for, already written, don't lose it in the move |

Notably: eva4k12's own framework JSON does **not** name individual outside researchers anywhere I found (`leadAuthors` names Dustin and Susan Hanisch, i.e. your own team — that's proper self-attribution, not the problem). The MPI-EVA personalization issue is concentrated somewhere more specific — see §4.

## 3. Schema fit: what maps cleanly, what needs an RFC

Checked `conceptbase/schemas/strand.schema.yaml` and `concept.schema.yaml` directly against eva4k12's shape:

- **Strands and their `performanceIndicators[]`** map cleanly — `oe:Strand`/`oe:SubStrand` already has `performanceIndicators`, `associatedDomains`, `typicalGradeBand`, `concepts[]` with `emphasis`, and a `relations{}` block for prerequisite/parallel/foundational sequencing. This is close to a direct port.
- **Compression concepts** map cleanly onto `oe:Concept` — this is exactly what `BIO-CORE`/`OE-INTERDISCIPLINARY` already are.
- **Cross-Cutting Themes are the one real schema gap.** eva4k12's CCTs (grade-banded, spanning multiple strands by design, carrying `sensitiveTopicFlags`/`teacherNote` fields) aren't quite an `oe:Concept` (too strand-spanning and pedagogically structured) and aren't an `oe:Strand` (not tied to one grade-band progression the way a strand is). **Recommend a short follow-up RFC** (same pattern as RFC-0011's citationOnly gap) proposing either (a) a `crossCuttingTheme` extension field on `oe:Strand` referencing which CCT a strand's substrand activates, or (b) a lightweight new `oe:CrossCuttingTheme` type. Don't guess this by forcing CCTs into `oe:Concept` — it would lose the `sensitiveTopicFlags`/`teacherNote` structure that's doing real work (§2's last row).
- **`sensitiveTopicFlags`/`teacherNote`/`indigenousKnowledgeStatement` have no home in the current schema at all.** Neither `concept.schema.yaml` nor `strand.schema.yaml` has anything like this. This is worth its own small addition regardless of the eva4k12 migration — it's exactly the kind of governance metadata a reviewer evaluating "responsible AI-supported curriculum infrastructure" would want to see modeled formally, not just present informally in one repo's JSON.

None of this blocks starting the migration — the RFC can run in parallel with moving the cleanly-mappable content (strands, concepts) first.

## 4. The de-personalization problem — and it's smaller than it looks

I checked eva4k12 itself first (grepped `framework/eva4k12_v1_2/*.json` for "MPI-EVA", "Dr.", "Prof.", researcher-name patterns) — **zero matches**. eva4k12's actual curriculum content is already organized around scientific sub-disciplines (Archaeogenetics, Comparative Cultural Psychology, etc.), not named people. It also already carries an explicit disaffiliation statement (§2). Good news: the source material doesn't need de-personalizing.

**The actual problem is in `oe-interdisciplinary-k12/strands/sandbox-mpi-eva-capstone.yaml`** — a sandbox-tier fork (`OE-SANDBOX-LPM-000003`, RFC-0010, branch `sandbox/mpi-eva-capstone`), not yet promoted to permanent status. It explicitly ties five of its performance indicators to named individual MPI-EVA researchers by surname — "Archaeogenetics (Krause)", "Human Origins (Kivell)", "Linguistic and Cultural Evolution (Gray)", "Human Behavior, Ecology and Culture (McElreath)", "Primate Behavior... (Tung) + Comparative Cultural Psychology (Haun)" — with a file-header comment stating these were "verified via web search 2026-07-21 (not fabricated)." This is precisely the pattern you want to move away from: durable curricular claims anchored to a specific person's continued tenure/output rather than to the science.

**Because this is sandbox-tier, not accepted/stable, it can simply be rewritten — `GOVERNANCE.md`'s never-delete policy only binds `accepted` and higher.** No RFC needed to fix this specific file; it's within the sandbox author's normal editorial discretion.

**Proposed fix, concrete not abstract:**
- Reframe section headers from `[Department Name] (Surname)` to the department/field name alone — `[Evolutionary Genetics / Archaeogenetics]`, `[Comparative Cognition]`, etc. — which the performance indicators already do in-line half the time anyway.
- Replace the file-header's per-department researcher list with an institution-level citation, using the schema's existing `citation` object (`text`/`url`/`doi` — already defined in `common.defs.yaml`, unused here) pointed at MPI-EVA's public research-area pages rather than individual staff pages. This is the mechanism for "give everyone credit" without content depending on any one person: cite the institute and its public research programs, not a named scientist's specific claims.
- Add an explicit acknowledgment line — something like "content areas informed by, but not reviewed or endorsed by, MPI-EVA Leipzig's public research programs" — matching the honesty pattern eva4k12's own `disaffiliation` field already models (§2). You said you're still very affiliated with MPI-EVA and want them credited; institutional-level, science-first credit is more durable and more appropriate than attributing specific curricular interpretations to individuals who didn't write or review this curriculum.
- Rename the strand/substrand labels away from personality-adjacent framing ("Seven Departments, One Question" is fine — it's already field-based; no change needed there).

This is a small, fast, independently-shippable fix — it doesn't need to wait on the larger eva4k12 migration and arguably should go first (§7).

## 5. Retiring eva4k12 itself

You said "delete and fully remove." Two real options, worth deciding explicitly rather than defaulting:

- **Hard delete** — removes the repo from GitHub entirely, including its git history. Nothing to cite, nothing recoverable if a migration gap is discovered later.
- **Archive (GitHub's built-in archived/read-only state)** — repo stays visible and citable at its existing URL, becomes read-only, clearly marked "Archived" in GitHub's UI, history fully preserved. This is what `conceptbase/GOVERNANCE.md`'s own deprecation philosophy ("remain resolvable... indefinitely") would suggest by analogy, even though that policy is written for registry entries, not whole repos.

**Recommendation: archive, don't hard-delete**, and only once migration is verified complete (§7's checklist). Reasoning: `eva4k12`'s content is cited today from `EvoMentor_DE`'s regional dataset and from this ecosystem's own design notes; a hard delete before every cross-reference is updated would break those links with no recovery path. Archiving gets you the practical outcome you actually want — it stops being a live, developed, competing repo — without the irreversibility. If you want it gone from your GitHub org listing entirely rather than sitting there marked archived, that's a real preference worth stating explicitly (§9), but I'd want that confirmed deliberately rather than assumed.

Either way, before any retirement action: update `EvoMentor_DE/data/lernziele_gy78_evolution.json`'s relationship to the migrated data (it currently duplicates eva4k12's regional file verbatim — decide whether it becomes the canonical copy or gets re-pointed at `oe-interdisciplinary-k12`), and add a final README notice to `eva4k12` itself pointing at its successor before archiving, so anyone who finds the old repo (a search engine, a citation) lands somewhere useful.

## 6. lab_manager's coordinating role

This is genuinely cross-repo work (`eva4k12` → `oe-interdisciplinary-k12`, a schema RFC in `conceptbase`, a downstream update in `EvoMentor_DE`, eventually an archival action) — exactly the kind of thing `lab_manager` was scoped for but hasn't done yet. Concretely, extending what's already designed rather than inventing new mechanism:

- **Add a "Consolidation" tracking artifact** to Tier 1 (`reports/daily/*.json`, per the existing dashboard plan) — a small, explicit checklist object (`eva4k12_migration: { strands_migrated: 0/7, concepts_migrated: 0/13, cct_rfc_status, regional_data_repointed: bool, sandbox_depersonalized: bool, eva4k12_archived: bool }`) that `git_health.py` reads from a status file the migration work updates as it proceeds, and the dashboard surfaces as a visible progress panel. This directly matches §5's ecosystem-level-checks category in the dashboard plan ("broken cross-repo references... duplicate/orphaned design-notes docs") — this is a bigger instance of the same idea.
- **Use the existing Tier 2 GWDG-assisted flow, not a new one**, if you want AI help drafting the migrated strand/concept YAML from eva4k12's JSON — the `harvest → embed → adjudicate → stamp` shape from `ccs-insights-pipelines-plan.md`, run locally/interactively, output as a draft PR for human review, never auto-merged. This is real, designed machinery already, just needs pointing at this specific migration task.
- **The migration itself should be a real RFC in `oe-interdisciplinary-k12`/`conceptbase`**, not an ad hoc port — consistent with how RFC-0011 handled the DigCompEdu/UNESCO/KMK ingestion. `lab_manager`'s dashboard can track that RFC's lifecycle stage the same way it already plans to track `proposals/` by lifecycle stage generally.
- Don't build a bespoke "migration agent" — per the dashboard plan's own stated principle (§9 there), any new automation should be a real `curriculum-agents/agents/*.md` persona calling real tools, not a one-off script. `oecb-schema-authoring` (already listed among `curriculum-agents`' skills) is the natural fit for drafting the migrated YAML against the CCT-extension schema once §3's RFC lands.

## 7. Phasing, sequenced to the grant runway

Given the ~2-3 month window before Modul C likely publishes:

1. **Now, independent of everything else:** de-personalize `sandbox-mpi-eva-capstone.yaml` (§4) — small, fast, removes the one piece of content that's actually a liability if a reviewer or an MPI-EVA colleague ever reads it closely.
2. **Week 1-2:** draft the CCT schema RFC (§3) in `conceptbase` — needed before any CCT content can migrate properly; can run in parallel with step 3.
3. **Week 1-3:** migrate the cleanly-mappable content first — the 7 strands' core structure and the 13 compression concepts don't need to wait on the CCT RFC.
4. **Week 3-5:** migrate CCT content once the RFC lands, including validating and expanding the scientific-racism/history-of-science entry into a real, expert-reviewable strand — this is also the single most persuasive interdisciplinary artifact identified in the earlier ecosystem survey, so this step does double duty for the grant.
5. **Week 4-5:** repoint `EvoMentor_DE`'s regional dataset, update `lab_manager`'s consolidation tracker to reflect completion.
6. **Week 5-6:** archive `eva4k12` with a clear README pointer, once the tracker confirms nothing still depends on it.

This leaves several weeks of runway before a likely Modul C publication for actually writing the resulting content into the proposal draft, rather than finishing the migration under deadline pressure.

## 8. The grant narrative this produces

This isn't just cleanup framed as a proof point after the fact — it's a genuinely good sovereignty argument in its own right. The core Modul C claim is that OpenEvo's governance model (RFC review, versioned identifiers, transparent provenance) produces infrastructure that doesn't depend on any single institution or individual's continued involvement to remain trustworthy and usable. A curriculum repo whose content is legible and durable *because* it's organized around scientific fields and cited institutional research programs — not because a specific named researcher vouches for each claim — is a direct, concrete demonstration of exactly that property. "We consolidated two overlapping efforts into one governed body of work, credited our research partners at the institutional level, and removed dependencies on any single person's continued output" is a stronger, more specific sovereignty story than the abstract version currently in the draft, and it's citable with real before/after diffs by the time a reviewer reads the proposal.

## 9. Open decisions — need your call

1. **Archive vs. hard-delete `eva4k12`** (§5) — I've recommended archive-after-migration-verified as the safer default; confirm or override.
2. **CCT schema shape** (§3) — extension field on `oe:Strand` vs. a new `oe:CrossCuttingTheme` type. I'd lean toward the extension field (smaller change, less new machinery) but this is a real design choice worth an RFC discussion, not something to decide unilaterally here.
3. **The two eva4k12 HTML apps** (§2) — rebuild against migrated data, or retire in favor of `conceptbase/app`'s existing explorer? Affects how much of steps 3-4 above is "port data" vs. "port data and rebuild a UI."
4. **`sensitiveTopicFlags`/`teacherNote`/`indigenousKnowledgeStatement` as a formal schema addition** (§3, last bullet) — worth doing regardless of this migration, or scope it as migration-specific for now and generalize later?
5. **Do you want me to start on item 1 of §7 (the sandbox de-personalization fix) now?** It's small, self-contained, and doesn't commit you to anything about the larger migration — I can do it in this session if you'd like, separately from the rest of this plan.
