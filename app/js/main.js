// Lab Manager — Ecosystem Dashboard. Static client-side app, no backend: reads
// Tier 1 JSON already committed to reports/daily/ (see
// docs/design-notes/ecosystem-dashboard-and-health-monitoring-plan.md §4).
import { initTheme, toggleTheme } from "./theme.js";

const STATUS_ORDER = ["good", "warning", "serious", "critical"];
const STATUS_LABEL = { good: "Good", warning: "Warning", serious: "Serious", critical: "Critical" };
const CANONICAL_ORG = "openevo-ccs";

initTheme();

// Works both after the Pages build (app/ and reports/ are flattened into the
// same _site/ root — see .github/workflows/pages.yml) and when testing locally
// by serving the repo root directly (app/ and reports/ are then still siblings,
// so the page needs the ../ form instead). Try the production path first.
async function fetchJsonWithFallback(prodPath, devPath) {
  for (const path of [prodPath, devPath]) {
    try {
      const res = await fetch(path, { cache: "no-store" });
      if (res.ok) return await res.json();
    } catch {
      /* try next */
    }
  }
  throw new Error(`Could not load ${prodPath} (tried ${devPath} too)`);
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function daysLabel(n) {
  if (n === null || n === undefined) return "—";
  if (n === 0) return "today";
  if (n === 1) return "1 day ago";
  return `${n} days ago`;
}

function repoUrl(r) {
  return r.remote ? r.remote.replace(/\.git$/, "") : null;
}

function renderStatTiles(report) {
  const grid = document.getElementById("stat-grid");
  const byStatus = report.repos_by_status || {};
  const tiles = [
    { label: "Repos tracked", value: report.repo_count, cls: "" },
    ...STATUS_ORDER.map((s) => ({ label: STATUS_LABEL[s], value: byStatus[s] ?? 0, cls: `status-${s}` })),
  ];
  grid.innerHTML = tiles
    .map((t) => `<div class="stat-tile ${t.cls}"><div class="num">${t.value}</div><div class="label">${t.label}</div></div>`)
    .join("");
}

// There is exactly one canonical org (github.com/openevo-ccs) — not a category to chart,
// an invariant to check. A handful of repos were found 2026-07-22 with stale local
// `origin` remotes still pointing at a pre-rename name; fixed via `git remote set-url`.
// This panel is the standing guard against that drifting back unnoticed.
function renderHygienePanel(report) {
  const panel = document.getElementById("hygiene-panel");
  const offenders = report.repos.filter((r) => r.wrong_org);
  const total = report.repo_count;
  const compliant = total - offenders.length;
  const ok = offenders.length === 0;

  panel.innerHTML = `
    <h2>Remote hygiene</h2>
    <p class="${ok ? "" : "muted"}">
      <span class="status-dot ${ok ? "good" : "serious"}"></span>
      <strong>${compliant} / ${total}</strong> repos have their <code>origin</code> remote
      correctly pointed at <code>github.com/${CANONICAL_ORG}</code>.
    </p>
    ${
      ok
        ? ""
        : `<p class="muted small">Needs <code>git remote set-url origin https://github.com/${CANONICAL_ORG}/&lt;repo&gt;.git</code>: ${offenders
            .map((r) => `<code>${r.name}</code> (currently <code>${r.github_org || "?"}</code>)`)
            .join(", ")}</p>`
    }
  `;
}

function renderTable(report, filters) {
  const tbody = document.getElementById("repo-tbody");
  const filtered = report.repos.filter((r) => filters.status === "all" || r.status === filters.status);

  document.getElementById("filtered-count").textContent = `${filtered.length} of ${report.repos.length} repos`;

  tbody.innerHTML = filtered
    .map((r) => {
      const url = repoUrl(r);
      const nameCell = url
        ? `<a href="${url}" target="_blank" rel="noopener">${r.name}</a>`
        : r.name;
      const sync = [];
      if (!r.clean) sync.push(`${r.uncommitted_change_count} uncommitted`);
      if (r.ahead) sync.push(`${r.ahead} ahead`);
      if (r.behind) sync.push(`${r.behind} behind`);
      const flags = [
        ...(r.missing_required_files || []).map((f) => `missing ${f}`),
        ...(r.missing_recommended_files || []).map((f) => `no ${f}`),
        ...(r.has_ci_workflow ? [] : ["no CI"]),
      ];
      // Show the branch actually checked out, not the repo's default — ahead/behind
      // above is computed against *this* branch's own upstream (git_health.py), so
      // showing "main" here while the numbers are for a feature branch would be
      // actively misleading, not just imprecise.
      const branchCell = r.on_default_branch
        ? r.current_branch || "—"
        : `${r.current_branch || "—"} <span class="muted small">(not ${r.default_branch || "default"})</span>`;
      return `
        <tr>
          <td class="status-cell"><span class="status-dot ${r.status}"></span>${STATUS_LABEL[r.status] || r.status}</td>
          <td>${nameCell}</td>
          <td><span class="org-badge${r.wrong_org ? " wrong" : ""}">${r.github_org || "?"}</span></td>
          <td>${branchCell}</td>
          <td>${sync.length ? sync.join(", ") : "in sync"}</td>
          <td>${daysLabel(r.days_since_last_commit)}</td>
          <td class="flags-cell">${flags.map((f) => `<span class="flag">${f}</span>`).join("") || "—"}</td>
        </tr>`;
    })
    .join("");
}

function populateFilters(report, onChange) {
  const statusSelect = document.getElementById("filter-status");
  statusSelect.innerHTML =
    `<option value="all">All statuses</option>` +
    STATUS_ORDER.map((s) => `<option value="${s}">${STATUS_LABEL[s]}</option>`).join("");

  const filters = { status: "all" };
  statusSelect.addEventListener("change", () => {
    filters.status = statusSelect.value;
    onChange(filters);
  });
}

async function main() {
  document.getElementById("theme-toggle").addEventListener("click", () => {
    toggleTheme();
    render();
  });

  let report;
  try {
    const index = await fetchJsonWithFallback("reports/daily/index.json", "../reports/daily/index.json");
    if (!index.latest) throw new Error("No daily reports available yet");
    report = await fetchJsonWithFallback(
      `reports/daily/${index.latest}.json`,
      `../reports/daily/${index.latest}.json`
    );
  } catch (err) {
    document.getElementById("tab-body").innerHTML =
      `<p class="muted">Could not load a health report: ${err.message}. Run <code>python scripts/git_health.py</code> first.</p>`;
    return;
  }

  document.getElementById("generated-at").textContent = `Generated ${fmtDate(report.generated_at)} · ${report.repo_count} repos scanned`;

  function render() {
    renderStatTiles(report);
    renderHygienePanel(report);
  }
  render();

  populateFilters(report, (filters) => renderTable(report, filters));
  renderTable(report, { status: "all" });
}

main();
