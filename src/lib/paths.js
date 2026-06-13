// paths.js — interne Links/Assets korrekt unter dem GitHub-Pages-Unterpfad
// (/wm2026/) erzeugen (PLAN.md 2).

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Interner Pfad inkl. base, z. B. href("spiel/de-cw") -> "/wm2026/spiel/de-cw". */
export function href(path = "") {
  return BASE + "/" + String(path).replace(/^\/+/, "");
}

/** Voll qualifizierte absolute URL (Canonical, OG, ICS, JSON-LD). */
export function absUrl(path, site) {
  return new URL(href(path), site).toString();
}
