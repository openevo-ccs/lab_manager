# lab_manager
The CCS Lab Manager

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC--BY--NC--SA--4.0-lightgrey.svg)](LICENSE) [![Tools License: MIT](https://img.shields.io/badge/tools%20License-MIT-yellow.svg)](LICENSE-CODE)

Ecosystem-wide health monitoring, git-health tooling, and a public GitHub Pages dashboard for
the OpenEvo CCS Lab. See
[`docs/design-notes/ecosystem-dashboard-and-health-monitoring-plan.md`](docs/design-notes/ecosystem-dashboard-and-health-monitoring-plan.md)
for the full design. Phases 1–3 done: scaffolding, the git-health scanner, and the dashboard
itself. Not yet built: weekly reports/retention rollups (Phase 4) and GWDG-assisted QC (Phase 5).

## Structure

- `docs/design-notes/` — planning docs (this repo's own design discipline, matching `conceptbase`)
- `scripts/git_health.py` — scans every sibling repo under the lab root, writes
  `reports/daily/<date>.json` + an `index.json` manifest, and flags any repo whose remote
  doesn't resolve to the one canonical org (`github.com/openevo-ccs`). Run it with `python
  scripts/git_health.py`; stdlib only, no dependencies.
- `app/` — the static dashboard (`index.html` + `css/` + `js/`), reading `reports/daily/`.
  Deployed via `.github/workflows/pages.yml`, same pattern as `conceptbase/app`.
- `reports/{daily,weekly}/` — **public**, committed. What the dashboard reads.
- `local/` — **private, gitignored, this machine only.** Full-detail reports, GWDG usage logs,
  caches, and real credentials (`local/.env`). See `local/README.md`.

## License

- `docs/`, `reports/`: CC-BY-NC-SA-4.0 ([`LICENSE`](LICENSE))
- `scripts/`, `app/` (dashboard/health-check code): MIT ([`LICENSE-CODE`](LICENSE-CODE))
