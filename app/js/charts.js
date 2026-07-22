// Chart.js helper, styled per the dataviz skill: thin marks, rounded bar ends,
// a single shared scale (never dual-axis), recessive gridlines, the built-in
// Chart.js tooltip as the hover layer. No legend — a single-series bar chart's
// title already names the series (marks-and-anatomy.md). Chart.js loaded via
// CDN in index.html (window.Chart). Trimmed from conceptbase/app/js/charts.js
// to the one chart this dashboard needs today.

import { currentMode } from "./theme.js";

const registry = new Map();

function ink(mode) {
  return {
    primary: mode === "dark" ? "#ffffff" : "#0b0b0b",
    secondary: mode === "dark" ? "#c3c2b7" : "#52514e",
    grid: mode === "dark" ? "#2c2c2a" : "#e1e0d9",
    axis: mode === "dark" ? "#383835" : "#c3c2b7",
  };
}

function baseFont() {
  return { family: "system-ui, -apple-system, 'Segoe UI', sans-serif", size: 12 };
}

export function destroyChart(canvas) {
  const existing = registry.get(canvas);
  if (existing) {
    existing.destroy();
    registry.delete(canvas);
  }
}

/** Single-series bar chart. `data`: [{label, value, color}] */
export function barChart(canvas, data) {
  if (!window.Chart) return null;
  destroyChart(canvas);
  const mode = currentMode();
  const c = ink(mode);

  const chart = new window.Chart(canvas, {
    type: "bar",
    data: {
      labels: data.map((d) => d.label),
      datasets: [
        {
          data: data.map((d) => d.value),
          backgroundColor: data.map((d) => d.color),
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 40,
          categoryPercentage: 0.6,
          barPercentage: 0.85,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          titleFont: baseFont(),
          bodyFont: baseFont(),
          padding: 8,
          callbacks: { title: (items) => items[0].label },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { color: c.axis },
          ticks: { color: c.secondary, font: baseFont() },
        },
        y: {
          beginAtZero: true,
          ticks: { color: c.secondary, font: baseFont(), precision: 0 },
          grid: { color: c.grid },
          border: { display: false },
        },
      },
    },
  });

  registry.set(canvas, chart);
  return chart;
}
