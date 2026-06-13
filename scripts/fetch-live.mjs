// fetch-live.mjs — API-Football (v3): Stadien (für Wetter/Ort) + Aufstellungen.
// Braucht den GitHub-Secret FOOTBALL_API_KEY. Ohne Schlüssel: No-Op.
// Tageslimit-schonend: Spielplan/Stadien nur ~1x/Tag, Aufstellungen nur für
// Spiele im Fenster [-2h, +3h] um den Anpfiff (max. 10 Abrufe/Lauf).

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { codeFor, pairKey } from "../src/lib/teamcodes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../src/data/live.json");
const MATCHES = resolve(__dirname, "../src/data/matches.json");

const KEY = process.env.FOOTBALL_API_KEY;
const BASE = "https://v3.football.api-sports.io";
const LEAGUE = 1; // FIFA World Cup
const SEASON = 2026;

async function api(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { "x-apisports-key": KEY } });
  if (!res.ok) throw new Error(`HTTP ${res.status} für ${path}`);
  const json = await res.json();
  if (json.errors && Object.keys(json.errors).length) {
    console.warn("API-Football meldet:", JSON.stringify(json.errors));
  }
  return json.response ?? [];
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function loadJson(file, fallback) {
  try { return JSON.parse(await readFile(file, "utf8")); } catch { return fallback; }
}

async function main() {
  if (!KEY) {
    console.log("ℹ FOOTBALL_API_KEY nicht gesetzt — überspringe Live-Daten.");
    process.exit(0);
  }

  const live = await loadJson(OUT, { updatedAt: null, venues: {}, fixtures: {}, lineups: {} });
  live.venues ??= {}; live.fixtures ??= {}; live.lineups ??= {};

  const matchesData = await loadJson(MATCHES, { matches: [] });
  const matches = matchesData.matches ?? [];

  // 1) Stadien/Fixture-IDs nur holen, wenn leer oder älter als 18h.
  const ageH = live.updatedAt ? (Date.now() - new Date(live.updatedAt).getTime()) / 3.6e6 : Infinity;
  if (!Object.keys(live.venues).length || ageH > 18) {
    try {
      const fixtures = await api(`/fixtures?league=${LEAGUE}&season=${SEASON}`);
      let n = 0;
      for (const f of fixtures) {
        const k = pairKey(codeFor(f.teams?.home?.name), codeFor(f.teams?.away?.name));
        if (!k) continue;
        live.venues[k] = { stadium: f.fixture?.venue?.name ?? "", city: f.fixture?.venue?.city ?? "" };
        live.fixtures[k] = f.fixture?.id ?? null;
        n++;
      }
      console.log(`✓ ${n} Stadien/Fixtures von API-Football`);
    } catch (e) {
      console.warn("… Fixtures-Abruf fehlgeschlagen:", e.message);
    }
  } else {
    console.log(`ℹ Stadien noch frisch (${ageH.toFixed(1)}h) — kein erneuter Abruf.`);
  }

  // 2) Aufstellungen für Spiele kurz vor/nach Anpfiff.
  const now = Date.now();
  const candidates = matches
    .filter((m) => m.kickoffUtc)
    .map((m) => ({ m, t: new Date(m.kickoffUtc).getTime(), k: pairKey(m.home?.code, m.away?.code) }))
    .filter(({ t, k }) => k && t >= now - 2 * 3.6e6 && t <= now + 3 * 3.6e6)
    .sort((a, b) => a.t - b.t)
    .slice(0, 10);

  let got = 0;
  for (const { m, k } of candidates) {
    const fid = live.fixtures[k];
    if (!fid) continue;
    try {
      const rows = await api(`/fixtures/lineups?fixture=${fid}`);
      if (rows.length >= 2) {
        const conv = (r) => ({
          team: r.team?.name ?? "",
          formation: r.formation ?? "",
          coach: r.coach?.name ?? "",
          xi: (r.startXI ?? []).map((p) => ({ n: p.player?.number ?? null, name: p.player?.name ?? "", pos: p.player?.pos ?? "" })),
          subs: (r.substitutes ?? []).map((p) => ({ n: p.player?.number ?? null, name: p.player?.name ?? "", pos: p.player?.pos ?? "" })),
        });
        live.lineups[m.slug] = { home: conv(rows[0]), away: conv(rows[1]), fetchedAt: new Date().toISOString() };
        got++;
      }
      await sleep(300);
    } catch (e) {
      console.warn(`… Aufstellung ${m.slug} fehlgeschlagen:`, e.message);
    }
  }
  console.log(`✓ ${got} Aufstellungen aktualisiert`);

  live.updatedAt = new Date().toISOString();
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(live, null, 2) + "\n", "utf8");
  console.log(`✓ live.json geschrieben`);
}

main().catch((e) => { console.error("fetch-live Fehler:", e); process.exit(0); });
