# Contributing to lab_manager

**Status:** This file is the current, authoritative contribution process — no separate
governance doc exists for this repo today.

## Before you start

Read the [README](README.md) and `docs/design-notes/` for the current design — this repo
follows the same draft-doc-with-Open-Decisions discipline as `conceptbase`'s design notes.
Most of this repo (`scripts/`, `app/`) was built collaboratively between Dustin Eirdosh and
Claude in a single working session (2026-07-22) — see the design docs' revision histories for
what's actually built vs. still proposed.

## Proposing a change

- **Design changes** (new checks, new report fields, changes to the public/private data split):
  open or update a `docs/design-notes/*.md` doc with an **Open Decision** section before
  building — matches the discipline the whole ecosystem already uses.
- **Bug fixes, small mechanical improvements**: open a PR directly. One reviewer approval before
  merge.
- **Never**: automated changes that touch another repo's `main` without a PR (see
  `docs/design-notes/ecosystem-cleanliness-and-maintenance-plan.md` §3's remediation safety
  model) — this applies to changes made *by* this repo's tooling as much as to changes made *to*
  this repo.

## Where things live

See the README's "Structure" section — `scripts/`, `app/`, `reports/` (public), `local/`
(private, gitignored).

## License

`docs/`, `reports/`: CC-BY-NC-SA-4.0. `scripts/`, `app/`: MIT. See `LICENSE` / `LICENSE-CODE`.

## Questions

Open a GitHub issue, or reach out to the OpenEvo Computational Curriculum Studies Lab
([openevo.eva.mpg.de](http://openevo.eva.mpg.de)).
