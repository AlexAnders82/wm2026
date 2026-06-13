// data.js — zentraler Zugriff auf Spielplan + Sender-Zuordnung.
// Reichert jedes Spiel mit TV-Infos (tv.json) und abgeleiteten Flags an.

import matchesData from "../data/matches.json";
import tvData from "../data/tv.json";
import { dayKey, dayHeader } from "./datetime.js";

/** Sender-Info für einen Slug; fehlt er, gilt der Fallback (nur MagentaTV). */
export function tvFor(slug) {
  return tvData.bySlug?.[slug] ?? tvData.fallback;
}

/** Ein Spiel um TV, DE-Flag, Phase und Exklusiv-Status ergänzen. */
function enrich(m) {
  const tv = tvFor(m.slug);
  const isDE = m.home?.code === "de" || m.away?.code === "de";
  const phase = /^gruppe/i.test(m.round ?? "") ? "group" : "ko";
  // Exklusiv = nirgends im Free-TV, nur Stream (MagentaTV) — DS 8.5.
  const isExclusive = !tv.free || tv.free === "none";
  return { ...m, tv, isDE, phase, isExclusive };
}

/** Alle Spiele, chronologisch (Spiele ohne Datum ans Ende). */
export function getMatches() {
  return matchesData.matches
    .map(enrich)
    .sort((a, b) => {
      if (!a.kickoffUtc) return 1;
      if (!b.kickoffUtc) return -1;
      return a.kickoffUtc.localeCompare(b.kickoffUtc);
    });
}

/** Ein einzelnes Spiel per Slug (für getStaticPaths/Spielseite). */
export function getMatchBySlug(slug) {
  return getMatches().find((m) => m.slug === slug) ?? null;
}

/** Nach deutschem Kalendertag gruppieren: [{ key, header, iso, matches }]. */
export function groupByDay(matches) {
  const groups = new Map();
  for (const m of matches) {
    if (!m.kickoffUtc) continue;
    const key = dayKey(m.kickoffUtc);
    if (!groups.has(key)) {
      groups.set(key, { key, header: dayHeader(m.kickoffUtc), iso: m.kickoffUtc, matches: [] });
    }
    groups.get(key).matches.push(m);
  }
  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
}

/** Andere Spiele am selben Tag (für Spielseite "Weitere Spiele"). */
export function sameDayMatches(match, limit = 3) {
  if (!match.kickoffUtc) return [];
  const key = dayKey(match.kickoffUtc);
  return getMatches()
    .filter((m) => m.slug !== match.slug && m.kickoffUtc && dayKey(m.kickoffUtc) === key)
    .slice(0, limit);
}

export const updatedAt = matchesData.updatedAt;
