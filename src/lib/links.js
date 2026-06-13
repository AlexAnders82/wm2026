// links.js — Auflösung externer Links über die zentrale links.json (PLAN.md 5.1).
import linksData from "../data/links.json";

/** Liefert {url, label, affiliate, rel, star} für einen Sender-/Link-Key. */
export function linkFor(key) {
  if (!key) return null;
  const entry = linksData[String(key).toLowerCase().replace(/\s+/g, "")];
  if (!entry) return null;
  return {
    url: entry.url,
    label: entry.label ?? key,
    affiliate: !!entry.affiliate,
    // Affiliate-Pflicht (UWG): rel=sponsored + Sternchen (PLAN.md 5.2)
    rel: entry.affiliate ? "sponsored noopener" : "noopener",
    star: !!entry.affiliate,
  };
}
