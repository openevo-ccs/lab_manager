// Theme detection: an explicit user toggle (persisted, stamped as data-theme
// on <html>) wins over the OS prefers-color-scheme signal. Copied from
// conceptbase/app/js/theme.js (same pattern, own storage key).

const KEY = "lab-manager-dashboard:theme";

export function currentMode() {
  const stamped = document.documentElement.getAttribute("data-theme");
  if (stamped === "dark" || stamped === "light") return stamped;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function initTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "dark" || saved === "light") {
      document.documentElement.setAttribute("data-theme", saved);
    }
  } catch {
    /* ignore */
  }
}

export function toggleTheme() {
  const next = currentMode() === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* ignore */
  }
  return next;
}
