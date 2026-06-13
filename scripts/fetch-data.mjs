// fetch-data.mjs — holt Spielplan + Ergebnisse der WM 2026 und schreibt sie
// normalisiert nach src/data/matches.json (Format siehe PLAN.md 3.2).
//
// Quellen-Reihenfolge (PLAN.md 3.1): erste funktionierende gewinnt.
//   1. OpenLigaDB        (kein Key, deutsche Teamnamen)
//   2. fixturedownload   (kein Key)
//
// WICHTIG: Bei Fehlern NICHT abbrechen. Wenn keine Quelle erreichbar ist,
// bleibt der bereits committete Snapshot bestehen (PLAN.md 3.4).

import { writeFile, readFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { slugify, codeFor, pairKey } from "../src/lib/teamcodes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../src/data/matches.json");

/** fetch mit Timeout, damit ein hängender Host den CI-Build nicht blockiert. */
async function getJson(url, { headers = {}, timeoutMs = 20000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} für ${url}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

// --- Quelle 1: OpenLigaDB ---
async function fromOpenLigaDB() {
  const leagues = await getJson("https://api.openligadb.de/getavailableleagues");
  const wm = leagues.find((l) => {
    const hay = `${l.leagueName ?? ""} ${l.leagueShortcut ?? ""}`.toLowerCase();
    return /world ?cup|weltmeister|wm|fifa/.test(hay) && String(l.leagueSeason ?? "").includes("2026");
  });
  if (!wm) throw new Error("OpenLigaDB: keine WM-2026-Liga gefunden");

  const data = await getJson(
    `https://api.openligadb.de/getmatchdata/${wm.leagueShortcut}/${wm.leagueSeason}`
  );
  return data.map((m) => {
    const result = (m.matchResults ?? []).slice().sort(
      (a, b) => (b.resultTypeID ?? 0) - (a.resultTypeID ?? 0)
    )[0];
    const homeName = m.team1?.teamName ?? "";
    const awayName = m.team2?.teamName ?? "";
    return {
      id: `m${m.matchID}`,
      slug: `${slugify(homeName)}-${slugify(awayName)}`,
      round: m.group?.groupName ?? "",
      kickoffUtc: m.matchDateTimeUTC ?? null,
      home: { name: homeName, code: codeFor(homeName) },
      away: { name: awayName, code: codeFor(awayName) },
      venue: { stadium: m.location?.locationStadium ?? "", city: m.location?.locationCity ?? "", country: "" },
      score: {
        home: result?.pointsTeam1 ?? null,
        away: result?.pointsTeam2 ?? null,
        status: m.matchIsFinished ? "finished" : "scheduled",
      },
    };
  });
}

// --- Quelle 2: fixturedownload.com ---
async function fromFixtureDownload() {
  const data = await getJson("https://fixturedownload.com/feed/json/fifa-world-cup-2026");
  return data.map((m) => {
    const homeName = m.HomeTeam ?? "";
    const awayName = m.AwayTeam ?? "";
    const finished = m.HomeTeamScore != null && m.AwayTeamScore != null;
    let kickoffUtc = null;
    if (m.DateUtc) kickoffUtc = new Date(m.DateUtc.replace(" ", "T") + "Z").toISOString();
    return {
      id: `m${m.MatchNumber}`,
      slug: `${slugify(homeName)}-${slugify(awayName)}`,
      round: m.Group ? `Gruppe ${m.Group.replace(/group /i, "")}` : (m.RoundNumber ? `Runde ${m.RoundNumber}` : ""),
      kickoffUtc,
      home: { name: homeName, code: codeFor(homeName) },
      away: { name: awayName, code: codeFor(awayName) },
      venue: { stadium: m.Location ?? "", city: "", country: "" },
      score: { home: m.HomeTeamScore ?? null, away: m.AwayTeamScore ?? null, status: finished ? "finished" : "scheduled" },
    };
  });
}

const SOURCES = [
  ["OpenLigaDB", fromOpenLigaDB],
  ["fixturedownload.com", fromFixtureDownload],
];

async function main() {
  let matches = null;
  for (const [name, fn] of SOURCES) {
    try {
      const result = await fn();
      if (Array.isArray(result) && result.length > 0) {
        matches = result;
        console.log(`✓ Datenquelle: ${name} (${result.length} Spiele)`);
        break;
      }
      console.warn(`… ${name} lieferte keine Spiele`);
    } catch (err) {
      console.warn(`… ${name} fehlgeschlagen: ${err.message}`);
    }
  }

  if (!matches) {
    console.warn("⚠ Keine Quelle erreichbar — bestehender Snapshot bleibt unverändert.");
    process.exit(0);
  }

  matches.sort((a, b) => {
    if (!a.kickoffUtc) return 1;
    if (!b.kickoffUtc) return -1;
    return a.kickoffUtc.localeCompare(b.kickoffUtc);
  });

  // Stadien aus fixturedownload ergänzen (kostenlos), falls Quelle keine liefert.
  if (matches.some((m) => !m.venue?.stadium && !m.venue?.city)) {
    try {
      const fd = await getJson("https://fixturedownload.com/feed/json/fifa-world-cup-2026");
      const idx = new Map();
      for (const r of fd) {
        const k = pairKey(codeFor(r.HomeTeam), codeFor(r.AwayTeam));
        if (k && r.Location) idx.set(k, r.Location);
      }
      let n = 0;
      for (const m of matches) {
        const k = pairKey(m.home?.code, m.away?.code);
        const loc = k ? idx.get(k) : null;
        if (loc && !m.venue.stadium && !m.venue.city) {
          // Location ist oft "Stadion, Stadt" — Stadt separat ablegen.
          const parts = String(loc).split(",").map((s) => s.trim());
          m.venue.stadium = parts[0] || loc;
          m.venue.city = parts.length > 1 ? parts[parts.length - 1] : "";
          n++;
        }
      }
      console.log(`✓ ${n} Stadien aus fixturedownload ergänzt`);
    } catch (e) {
      console.warn("… Stadien-Anreicherung fehlgeschlagen:", e.message);
    }
  }

  const payload = { updatedAt: new Date().toISOString(), matches };
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`✓ ${matches.length} Spiele geschrieben → ${OUT}`);
}

main().catch(async (err) => {
  console.error("Unerwarteter Fehler:", err);
  try { await readFile(OUT, "utf8"); console.warn("Bestehender Snapshot bleibt erhalten."); }
  catch { console.error("Kein Snapshot vorhanden!"); }
  process.exit(0);
});
