# Expert-Knowledge Graphs + Companion LPMs: A Restructuring Plan for `ccs-graph`, `openevo-graph`, `eva-graph`

| | |
|---|---|
| **Project** | Define and sequence the restructuring of the ecosystem's three `-graph` repos (`ccs-graph`, `openevo-graph`, `eva-graph`) under a newly agreed organizing principle: a `-graph` repo models a field's *expert knowledge* using whatever schema that field actually needs, paired with at least one OECB-governed **LPM** modeling the *developmental pathway* a student walks toward that expert knowledge. |
| **Relationship to existing work** | Supersedes part of `openevo-graph-and-ccs-graph-design-governance-concept.md`'s framing for `ccs-graph`/`openevo-graph` (that note treated `ccs-graph`'s non-`curricular` node types as needing to either fit OECB or stay orphaned; this note resolves that by design — expert-knowledge content was never meant to fit `oe:Concept`'s shape, only its *learner pathway* needs OECB governance). Does not reopen or re-litigate `eva4k12`'s already-approved migration (RFC-0012/0013) or the content-anchor/thinking-tool RFC already scoped in that note's §9.1 — both continue as planned. |
| **Document status** | **Plan only — no execution.** Every action item below is proposed, not started. Written at Dustin's explicit request ("create a plan... don't do the work now") following a conversation that worked through, and rejected, two earlier framings (a new sibling infrastructure repo "OpenEvo ScienceBase"; folding expert-knowledge content into OECB's existing vocabulary mechanism) before arriving at the principle this note documents. |
| **Author** | Claude (planning pass), for review by Dustin Eirdosh |
| **Date** | 2026-07-23 |

## Table of contents

1. [The organizing principle](#1-the-organizing-principle)
2. [What this resolves from prior analysis](#2-what-this-resolves-from-prior-analysis)
3. [`ccs-graph`](#3-ccs-graph)
4. [`openevo-graph`](#4-openevo-graph)
5. [`eva-graph`](#5-eva-graph)
6. [Cross-cutting sequencing and governance](#6-cross-cutting-sequencing-and-governance)
7. [Open decisions requiring Dustin's input](#7-open-decisions-requiring-dustins-input)
8. [Explicitly out of scope for this pass](#8-explicitly-out-of-scope-for-this-pass)

---

## 1. The organizing principle

Stated by Dustin, 2026-07-23:

> Any repo with the `-graph` name implies an extended expert knowledge modelling on top of at least one LPM reflecting development towards that modelled expert knowledge. Each `-graph` repo is free to construct and use any extended schemas for representing elements, artifacts, and interactives used to model their expert knowledge.

Two layers, two different governance regimes:

- **The expert-knowledge layer** (the `-graph` repo itself) — computational measures, research methods, theoretical constructs, people, literature, whatever elements/artifacts/interactives a field's own expert discourse actually needs. Schema is **local and free** — not obligated to fit any OECB class. This is each `-graph` repo's own infrastructure to design, the way `ccs-graph`'s relation schema (multi-scale tagging, tiered prose, confidence scoring) already does.
- **The pathway layer** (a companion **LPM**, OECB-governed, same shape as `bio-core-k12`/`oe-interdisciplinary-k12`) — the learner-facing developmental trajectory from lower anchor to an upper anchor that engages with that expert knowledge. This layer **must** go through OECB's real `oe:Concept`/`oe:Strand`/`oe:SubStrand` schema and RFC process, because that's the interoperability layer other repos and tooling actually depend on (registry resolution, cross-vocabulary alignment, the reference-LPM pluralism model).

## 2. What this resolves from prior analysis

Earlier in this same design conversation, two framings were tried and set aside:

- **"OpenEvo ScienceBase" (OESB)** — a new sibling infrastructure repo generalizing OECB's pattern for any field-knowledge graph. Rejected as premature: `ccs-graph` was the only real consumer, and this lab has already caught itself over-generalizing from a sample size of one twice before (`openevo-graph`'s vocabulary, the CASE crosswalk).
- **Folding expert content into OECB's existing vocabulary mechanism** — tested field-by-field and found to be a genuine partial fit: disciplinary *concepts* (content anchors, CCS theory constructs, core evolutionary-anthropology concepts) fit `oe:Concept`'s per-discipline-definition shape well. But a field's *research apparatus* — a measure's formal definition and software bindings, a scored methodological claim, literature, people — does not, and forcing it through `oe:Concept`'s `extensions` escape hatch would just be smuggling a second schema through a field meant for something narrower.

Dustin's principle resolves the second tension directly: expert-apparatus content was **never supposed to** go into OECB. It stays in the `-graph` repo's own schema, permanently, by design — not as a temporary state waiting for a bigger schema. What *does* need OECB governance is only the learner-pathway content, and that was already the right answer (it's exactly what `bio-core-k12`/`oe-interdisciplinary-k12` already are). This also gives `ccs-graph`'s relation records a real reason to reference OECB ids directly (a gap flagged earlier in this conversation): a relation record's curricular claim should point at the actual `OE-CONCEPT-######`/`OE-STRAND-######` inside the relevant LPM wherever one exists, rather than a local duplicate node — the LPM is the bridge between the two layers, not a schema merge.

## 3. `ccs-graph`

**Expert-knowledge layer (already mostly right, needs completion, not restructuring):**

- Keep the existing five node types (`computational`, `curricular`, `people`, `literature`, `technological`) and the relation/`edges` schema — this is the field's own methods-and-theory apparatus and correctly stays local.
- Finish the still-missing `schemas/*.yaml` files (`$schema:` in every existing file points at a schema that doesn't exist in the repo — flagged earlier this session, unaffected by this new principle, still the first concrete blocker).
- Complete the already-agreed doc triage (`curriculum_evolution_theory.md` and the `ccs_scientific_principles` drafts → `curriculum-evolution/docs/archive/`; `case_models_ccs.md` cross-linked, not archived) — already largely executed per the prior design note, just needs to finish.
- Resolve `nodes/ccs_core/`'s inconsistency (prose `.md`, not structured YAML like every other node folder) — either convert it into real `curricular/` nodes or make it an explicit pointer-only folder into `curriculum-evolution`'s Manual.

**New: `CCS-LPM`** — a companion, OECB-governed LPM whose pathway is *engagement with the theories and methods of CCS itself* — not "curriculum content a K-12 student learns," but the methodological competencies `ccs-graph` models: thinking about curriculum as an information system, participatory curriculum meta-modelling, evolutionary curriculum theory. `nodes/ccs_core/ccs_core.md` already names a real candidate audience for this — "teacher education students, educators, and possibly also learners" — which is a strong signal this LPM's grade-band is *not* K-12 in the usual sense, more likely teacher-education / graduate / advanced-secondary. That should be confirmed, not assumed (see §7).

**Mechanism connecting the two layers:** `CCS-LPM`'s upper-anchor content should be built directly from `ccs-graph`'s own theory/relation nodes (e.g. Learning Progressions as a theoretical construct, entropy-as-LP-diagnostic as a worked methodological example) — the expert graph supplies what the pathway is building *toward*.

## 4. `openevo-graph`

**Expert-knowledge layer — broader scope than previously framed.** The prior design note scoped `openevo-graph` narrowly (design-concept vocabulary source + CASE-crosswalk app). Dustin's description here is wider: the educational design concept, the theory of school improvement, design-based-research methodology, and the live WordPress `TeachingBase`/`ProjectBase` content (already real, already synced — `wordpress-sync/`). Read against the `ccs-graph`/`curriculum-evolution` precedent (prose Manual vs. graph-native companion), the natural parallel is: **`openevo-graph` becomes the graph-native structured form of OpenEvo's own applied program, with `curriculum-evolution`/the Teacher's Guide as the prose source of record** — the same relationship `ccs-graph` already has to `curriculum-evolution`, not a new one. DBR-methodology content specifically should be reconciled against `curriculum-evolution`'s existing treatment (it already documents the DBR cycle, per `dbr-cycle-facilitator`) rather than re-authored independently.

- The already-scoped content-anchor/thinking-tool → tagged-`oe:Concept` RFC (§9.1 of the prior note) is unaffected and still the right move — that content is genuinely concept-shaped, and it's what feeds the LPM's upper anchor, not a competing home for it.
- The CASE crosswalk, `wordpress-sync`, and the `design-system` app are pipeline/application layers, not expert-knowledge-model content — untouched by this restructuring.

**New: `OpenEvo-LPM`** — pathway for students into the interdisciplinary conceptual dimensions of understanding humans across the content-anchor domains. **Open question, not yet resolved (see §7): this description is very close to what `oe-interdisciplinary-k12` already *is*** ("a cross-disciplinary K–12 progression... agency-inclusive framing"). The lower-risk path is treating `oe-interdisciplinary-k12` *as* `OpenEvo-LPM` — formalizing its role and name rather than building a duplicate — but that's a real decision, not a default to assume silently.

## 5. `eva-graph`

**The largest lift, and the one with a real institutional-representation dimension, not just a technical one.**

Direct read of the repo confirms Dustin's diagnosis: it is explicitly and thoroughly MPI-EVA's own operational data — `mpi_eva/` (PURE-sourced publication data and topic models of the department's own research output, org sub-units), `mpi_eva_exhibit/` (a museum exhibit design concept — Sankey diagrams, artefact lists — not a knowledge graph at all), and `curriculum_models/` (which duplicates `eva4k12` content already mid-migration into OECB/`oe-interdisciplinary-k12` per RFC-0012/0013).

**Proposed restructuring:**

1. **Re-scope the repo's primary identity** from "MPI-EVA's repo" to "Evolutionary Anthropology as a field" — README, top-level structure, and framing all change to describe the discipline broadly (biological anthropology, paleoanthropology, primatology, human behavioral ecology, cultural evolution, comparative cognition, and other major sub-fields), not one institute's output.
2. **Relocate, don't delete, the MPI-EVA-specific material.** `mpi_eva/` and `mpi_eva_exhibit/` move under an explicit institution-scoped path (e.g. `institutions/mpi-eva/`) so MPI-EVA remains represented — "among other leaders in the field," per Dustin's framing — without driving the repo's top-level names or structure. Other institutions' contributions, if/when they materialize, would get parallel sibling paths under `institutions/`.
3. **Do not reopen the `eva4k12` migration.** `curriculum_models/`'s content is already governed by an approved, in-flight plan elsewhere; this restructuring should let it finish on its existing track, not re-home it under the new general-field framing.
4. **Build the actual general-field expert-knowledge content** — this doesn't exist yet in any structured form (`mpi_eva/`'s topic-model/PURE data is department-specific bibliometrics, not a disciplinary concept/method vocabulary). This is new authoring work, not a migration.
5. **Schema note:** `eva-graph` is structurally the same *kind* of thing as `ccs-graph` (a research field's own theory/methods/people/literature) — flagged in this conversation as the first real candidate for testing whether `ccs-graph`'s schema shape actually generalizes to a second field. Worth trying directly (author a real `eva-graph` literature or relation record against `ccs-graph`'s schema, see what breaks) rather than inventing a separate schema from scratch — but only once `ccs-graph`'s own schema is finished (§3), and only as an experiment, not an assumption that it will fit unmodified.

**New: `Eva-LPM`** — pathway for students into the concepts, methods, and competencies *of evolutionary anthropologists as practitioners* — discipline-specific in a way that's distinct from both `bio-core-k12` (biology-general) and `oe-interdisciplinary-k12`/`OpenEvo-LPM` (cross-disciplinary, human-understanding-across-anchors framing). This is the same expert-graph → LPM bridge pattern as `ccs-graph`/`CCS-LPM`: the pathway builds toward practicing the discipline the graph models, not just knowing facts from it.

**Governance sensitivity, flagged explicitly:** re-scoping a repo's public identity away from the lab's own home institution is a real institutional-representation decision, not purely technical — the same category of question the prior design note treated the `FAIR_Curriculum.md` publication-status call as: a fact/decision only Dustin can actually make, not something to execute on inferred intent. See §7.

## 6. Cross-cutting sequencing and governance

- Each new LPM (`CCS-LPM`, `OpenEvo-LPM`, `Eva-LPM`) needs an OECB RFC reserving an `OE-LPM-######` id and a strand block, per `GOVERNANCE.md`'s existing Identifier Block Allocation table — real review overhead, one RFC per LPM, not a batch.
- Per the prior design note's own logic (don't compete with `eva4k12`'s in-flight, grant-runway-linked migration for the same limited maintainer/domain-editor attention), none of this should start until that migration's Open Decision 6 lands — same sequencing rule, still applies, now covering three restructurings instead of one.
- Recommended order by readiness and risk, not by repo-name alphabetics:
  1. **`ccs-graph`** — lowest risk, already well-scoped, blocked only on finishing its own schema (independent, no new institutional or naming decisions).
  2. **`openevo-graph`** — mostly a reconciliation + one naming/identity decision (`oe-interdisciplinary-k12` vs. new `OpenEvo-LPM`), low new-authoring lift.
  3. **`eva-graph`** — highest lift (new general-field content authored from scratch) and the one genuine institutional-sensitivity decision — sequence last, and get explicit sign-off on the rebrand framing before any repo-structure changes, not after.

## 7. Open decisions requiring Dustin's input

Not design choices this note can resolve from ecosystem precedent — genuine calls only Dustin can make:

1. **`CCS-LPM`'s actual target audience/grade-band.** Teacher-education students? Graduate researchers? Advanced secondary? `ccs_core.md`'s existing language points toward the first two, but this needs confirming before strand design starts.
2. **Is `OpenEvo-LPM` a new repo, or is `oe-interdisciplinary-k12` being renamed/reframed into that role?** Its existing description already matches closely — worth confirming rather than building a duplicate.
3. **`eva-graph`'s rebrand framing itself** — how MPI-EVA should be represented ("among other leaders," per Dustin's own phrase) once it's no longer the repo's namer/driver. This is a real public-facing institutional-representation decision.
4. **New-repo vs. new-directory** for each LPM — should `CCS-LPM`/`Eva-LPM` be standalone repos (matching `bio-core-k12`'s pattern) or something lighter, given at least `CCS-LPM` may target a much smaller audience than a full K-12 reference LPM?

## 8. Explicitly out of scope for this pass

- Any actual schema, node, or LPM authoring — this note is a plan, nothing here has been built.
- Reopening `eva4k12`'s already-approved migration path.
- Reopening the content-anchor/thinking-tool RFC's already-resolved shape (§9.1 of the prior note) — still tagged-`oe:Concept`, unaffected by this principle.
- `eva-graph`'s `mpi_eva_exhibit/` content getting any new treatment beyond relocation under an institution-scoped path — it's a public-engagement/exhibit-design artifact, not a knowledge-graph concern, and doesn't need solving here.
