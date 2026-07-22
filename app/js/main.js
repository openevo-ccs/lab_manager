// Lab Manager — Ecosystem Dashboard. Static client-side app, no backend: reads
// Tier 1 JSON already committed to reports/daily/ (see
// docs/design-notes/ecosystem-dashboard-and-health-monitoring-plan.md §4).
import { initTheme, toggleTheme, currentMode } from "./theme.js";
import { barChart } from "./charts.js";

const STATUS_ORDER = ["good", "warning", "serious", "critical"];
const STATUS_LABEL = { good: "Good", warning: "Warning", serious: "Serious", critical: "Critical" };

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

function renderOrgChart(report) {
  const canvas = document.getElementById("org-chart");
  const c = getComputedStyle(document.documentElement);
  const seriesColors = [c.getPropertyValue("--series-a").trim(), c.getPropertyValue("--series-b").trim()];
  const entries = Object.entries(report.repos_by_org || {}).sort((a, b) => b[1] - a[1]);
  const data = entries.map(([org, count], i) => ({
    label: org,
    value: count,
    color: seriesColors[i % seriesColors.length],
  }));
  barChart(canvas, data);
}

function renderTable(report, filters) {
  const tbody = document.getElementById("repo-tbody");
  const filtered = report.repos.filter(
    (r) =>
      (filters.org === "all" || r.github_org === filters.org) &&
      (filters.status === "all" || r.status === filters.status)
  );

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
      return `
        <tr>
          <td class="status-cell"><span class="status-dot ${r.status}"></span>${STATUS_LABEL[r.status] || r.status}</td>
          <td>${nameCell}</td>
          <td><span class="org-badge">${r.github_org || "?"}</span></td>
          <td>${r.default_branch || r.current_branch || "—"}</td>
          <td>${sync.length ? sync.join(", ") : "in sync"}</td>
          <td>${daysLabel(r.days_since_last_commit)}</td>
          <td class="flags-cell">${flags.map((f) => `<span class="flag">${f}</span>`).join("") || "—"}</td>
        </tr>`;
    })
    .join("");
}

function populateFilters(report, onChange) {
  const orgSelect = document.getElementById("filter-org");
  const orgs = Object.keys(report.repos_by_org || {}).sort();
  orgSelect.innerHTML =
    `<option value="all">All orgs</option>` + orgs.map((o) => `<option value="${o}">${o}</option>`).join("");

  const statusSelect = document.getElementById("filter-status");
  statusSelect.innerHTML =
    `<option value="all">All statuses</option>` +
    STATUS_ORDER.map((s) => `<option value="${s}">${STATUS_LABEL[s]}</option>`).join("");

  const filters = { org: "all", status: "all" };
  orgSelect.addEventListener("change", () => {
    filters.org = orgSelect.value;
    onChange(filters);
  });
  statusSelect.addEventListener("change", () => {
    filters.status = statusSelect.value;
    onChange(filters);
  });
}

async function main() {
  document.getElementById("theme-toggle").addEventListener("click", () => {
    toggleTheme();
    // Re-render the chart so its colors pick up the new mode's CSS variables.
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
    renderOrgChart(report);
  }
  render();

  populateFilters(report, (filters) => renderTable(report, filters));
  renderTable(report, { org: "all", status: "all" });
}

main();
