// data.js — zentraler Zugriff auf Spielplan, Sender-Zuordnung, Gruppen & Tabellen.
// Gruppen und Tabellen werden komplett aus den vorhandenen Spielen/Ergebnissen
// abgeleitet (keine externe Quelle nötig).

import matchesData from "../data/matches.json";
import tvData from "../data/tv.json";
import liveData from "../data/live.json";
import weatherData from "../data/weather.json";
import { dayKey, dayHeader } from "./datetime.js";
import { pairKey } from "./teamcodes.mjs";

/** Sender-Info für einen Slug; fehlt er, gilt der Fallback. */
export function tvFor(slug) {
  return tvData.bySlug?.[slug] ?? tvData.fallback;
}

/** Spieltag-Nummer aus "Gruppenphase N" ableiten. */
function matchdayOf(round) {
  const m = /(\d+)/.exec(round ?? "");
  return m ? Number(m[1]) : null;
}

/** Basis-Anreicherung ohne Gruppen-Zuordnung. */
function baseEnrich(m) {
  const tv = tvFor(m.slug);
  const isDE = m.home?.code === "de" || m.away?.code === "de";
  const phase = /^gruppe/i.test(m.round ?? "") ? "group" : "ko";
  // Exklusiv nur, wenn ausdrücklich so markiert — keine Annahme bei fehlender Info.
  const isExclusive = tv.exclusive === true;
  return { ...m, tv, isDE, phase, isExclusive, matchday: phase === "group" ? matchdayOf(m.round) : null };
}

// ---------------------------------------------------------------------------
// Gruppen + Tabellen aus den Spielen ableiten
// ---------------------------------------------------------------------------
let _groupInfo = null;

function computeGroupInfo() {
  if (_groupInfo) return _groupInfo;
  const base = matchesData.matches.map(baseEnrich);
  const groupMatches = base.filter((m) => m.phase === "group" && m.home?.name && m.away?.name);

  // Union-Find: Teams, die in der Gruppenphase gegeneinander spielen, sind eine Gruppe.
  const parent = new Map();
  const find = (x) => {
    if (parent.get(x) !== x) parent.set(x, find(parent.get(x)));
    return parent.get(x);
  };
  const add = (x) => { if (!parent.has(x)) parent.set(x, x); };
  const union = (a, b) => { parent.set(find(a), find(b)); };
  for (const m of groupMatches) {
    add(m.home.name); add(m.away.name); union(m.home.name, m.away.name);
  }

  // Komponenten sammeln (+ frühester Anstoß zur Sortierung, + Team-Codes).
  const comps = new Map();
  const codeOf = new Map();
  for (const m of groupMatches) {
    codeOf.set(m.home.name, m.home.code);
    codeOf.set(m.away.name, m.away.code);
    for (const name of [m.home.name, m.away.name]) {
      const root = find(name);
      if (!comps.has(root)) comps.set(root, { teams: new Set(), earliest: m.kickoffUtc });
      comps.get(root).teams.add(name);
      if (m.kickoffUtc && (!comps.get(root).earliest || m.kickoffUtc < comps.get(root).earliest)) {
        comps.get(root).earliest = m.kickoffUtc;
      }
    }
  }

  // Gruppen nach frühestem Spiel sortieren und A, B, C … vergeben.
  const sorted = [...comps.values()].sort((a, b) =>
    String(a.earliest).localeCompare(String(b.earliest))
  );
  const groupOf = new Map();
  const groups = sorted.map((comp, i) => {
    const letter = String.fromCharCode(65 + i);
    for (const t of comp.teams) groupOf.set(t, letter);
    return { letter, teams: [...comp.teams] };
  });

  // Tabellen aus beendeten Gruppenspielen berechnen.
  const stats = new Map(); // team -> row
  const row = (name) => {
    if (!stats.has(name)) stats.set(name, { team: name, code: codeOf.get(name) ?? null, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 });
    return stats.get(name);
  };
  for (const t of groupOf.keys()) row(t); // alle Teams listen, auch 0 Spiele
  for (const m of groupMatches) {
    if (m.score?.status !== "finished" || m.score.home == null || m.score.away == null) continue;
    const h = row(m.home.name), a = row(m.away.name);
    h.p++; a.p++;
    h.gf += m.score.home; h.ga += m.score.away;
    a.gf += m.score.away; a.ga += m.score.home;
    if (m.score.home > m.score.away) { h.w++; a.l++; h.pts += 3; }
    else if (m.score.home < m.score.away) { a.w++; h.l++; a.pts += 3; }
    else { h.d++; a.d++; h.pts++; a.pts++; }
  }
  for (const r of stats.values()) r.gd = r.gf - r.ga;

  for (const g of groups) {
    g.standings = g.teams
      .map((t) => stats.get(t))
      .sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.team.localeCompare(y.team));
  }

  _groupInfo = { groupOf, groups };
  return _groupInfo;
}

/** Alle Gruppen mit Tabellen [{letter, standings:[…]}]. */
export function getGroups() {
  return computeGroupInfo().groups;
}

/** Gruppe (Buchstabe) eines Spiels bzw. einer einzelnen Gruppe per Buchstabe. */
export function getGroup(letter) {
  return computeGroupInfo().groups.find((g) => g.letter === letter) ?? null;
}

function enrich(m) {
  const e = baseEnrich(m);
  const info = computeGroupInfo();
  const g = info.groupOf.get(e.home?.name) ?? info.groupOf.get(e.away?.name) ?? null;
  // Stadion aus Live-Daten (API-Football) ergänzen, wenn vorhanden.
  const pk = pairKey(e.home?.code, e.away?.code);
  const lv = pk ? liveData.venues?.[pk] : null;
  const venue = lv && (lv.stadium || lv.city) ? { ...e.venue, ...lv } : e.venue;
  const lineup = liveData.lineups?.[m.slug] ?? null;
  const weather = weatherData?.[m.slug] ?? null;
  return { ...e, group: g, venue, lineup, weather };
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
