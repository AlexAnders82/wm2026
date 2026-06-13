// fetch-live.mjs — Aufstellungen via TheSportsDB (kostenlos, community-gepflegt).
// Stadien kommen bereits aus fetch-data (fixturedownload). Hier nur Lineups,
// best-effort: was verfügbar ist, wird gezeigt; sonst ehrlicher Hinweis im UI.
// Nur für Spiele im Fenster [-2h, +4h] um den Anpfiff.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { codeFor, pairKey } from "../src/lib/teamcodes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../src/data/live.json");
const MATCHES = resolve(__dirname, "../src/data/matches.json");

// Öffentlicher Test-Key von TheSportsDB. Optional per Env überschreibbar.
const KEY = process.env.SPORTSDB_KEY || "123";
const BASE = `https://www.thesportsdb.com/api/v1/json/${KEY}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
async function loadJson(file, fallback) {
  try { return JSON.parse(await readFile(file, "utf8")); } catch { return fallback; }
}

function dateUTC(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

/** TheSportsDB-Lineup-Array -> {home, away} oder null. */
function parseLineup(rows, homeName, awayName) {
  const side = (isHome) => {
    const items = rows.filter((r) => (r.strHome === "Yes") === isHome);
    const players = items.filter((r) => r.strSubstitute !== "Yes");
    const subs = items.filter((r) => r.strSubstitute === "Yes");
    const map = (r) => ({ n: r.intSquadNumber ? Number(r.intSquadNumber) : null, name: r.strPlayer ?? "", pos: r.strPosition ?? "" });
    return {
      team: isHome ? homeName : awayName,
      formation: items[0]?.strFormation ?? "",
      coach: "",
      xi: players.map(map),
      subs: subs.map(map),
    };
  };
  const home = side(true), away = side(false);
  if (!home.xi.length && !away.xi.length) return null;
  return { home, away, fetchedAt: new Date().toISOString() };
}

async function main() {
  const live = await loadJson(OUT, { updatedAt: null, venues: {}, fixtures: {}, lineups: {} });
  live.lineups ??= {};
  const matchesData = await loadJson(MATCHES, { matches: [] });
  const matches = matchesData.matches ?? [];

  const now = Date.now();
  const windowMatches = matches.filter((m) => {
    if (!m.kickoffUtc) return false;
    const t = new Date(m.kickoffUtc).getTime();
    return t >= now - 2 * 3.6e6 && t <= now + 4 * 3.6e6;
  });

  let checked = 0, got = 0, lastError = null;
  const eventCache = new Map();

  for (const m of windowMatches.slice(0, 8)) {
    const pk = pairKey(m.home?.code, m.away?.code);
    if (!pk) continue;
    checked++;
    try {
      const d = dateUTC(m.kickoffUtc);
      if (!eventCache.has(d)) {
        const j = await getJson(`${BASE}/eventsday.php?d=${d}&s=Soccer`);
        eventCache.set(d, j.events ?? []);
        await sleep(400);
      }
      const ev = (eventCache.get(d) || []).find((e) => {
        if (!/world cup/i.test(e.strLeague ?? "")) return false;
        const k = pairKey(codeFor(e.strHomeTeam), codeFor(e.strAwayTeam));
        return k === pk;
      });
      if (!ev?.idEvent) continue;
      const lj = await getJson(`${BASE}/lookuplineup.php?id=${ev.idEvent}`);
      await sleep(400);
      const parsed = parseLineup(lj.lineup ?? [], m.home?.name, m.away?.name);
      if (parsed) { live.lineups[m.slug] = parsed; got++; }
    } catch (e) {
      lastError = e.message;
      console.warn(`… Lineup ${m.slug}:`, e.message);
    }
  }

  live._diag = { source: "thesportsdb", windowMatches: windowMatches.length, checked, got, lastError, at: new Date().toISOString() };
  live.updatedAt = new Date().toISOString();
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(live, null, 2) + "\n", "utf8");
  console.log(`✓ TheSportsDB: ${got}/${checked} Aufstellungen (Fenster: ${windowMatches.length})`);
}

main().catch((e) => { console.error("fetch-live Fehler:", e); process.exit(0); });
