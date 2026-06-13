// fetch-data.mjs — holt Spielplan + Ergebnisse der WM 2026 und schreibt sie
// normalisiert nach src/data/matches.json (Format siehe PLAN.md 3.2).
//
// Quellen-Reihenfolge (PLAN.md 3.1): erste funktionierende gewinnt.
//   1. OpenLigaDB        (kein Key, deutsche Teamnamen)
//   2. fixturedownload   (kein Key)
//   3. football-data.org (Key via Env FOOTBALL_DATA_TOKEN, nur Fallback)
//
// WICHTIG: Bei Fehlern NICHT abbrechen. Wenn keine Quelle erreichbar ist,
// bleibt der bereits committete Snapshot bestehen (PLAN.md 3.4). Das Skript
// läuft im stündlichen GitHub-Actions-Build mit vollem Netzzugang.

import { writeFile, readFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../src/data/matches.json");

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

/** URL-tauglichen Slug aus einem Namen bauen (deutsche Umlaute/Akzente weg). */
function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // Akzente entfernen
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/&/g, "und")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Teamname -> ISO-3166-alpha-2 (für SVG-Flaggen). Die vier UK-Nationen nutzen
// die flag-icons-Subcodes (gb-eng usw.). Unbekanntes -> null (UI zeigt Fallback).
const CODE_BY_NAME = {
  argentinien: "ar", argentina: "ar",
  australien: "au", australia: "au",
  belgien: "be", belgium: "be",
  bolivien: "bo", bolivia: "bo",
  brasilien: "br", brazil: "br",
  "bosnien-herzegowina": "ba", bosnia: "ba",
  "kap verde": "cv", "cape verde": "cv", kapverde: "cv",
  kanada: "ca", canada: "ca",
  "costa rica": "cr",
  curacao: "cw", "curaçao": "cw",
  daenemark: "dk", denmark: "dk",
  deutschland: "de", germany: "de",
  ecuador: "ec",
  aegypten: "eg", egypt: "eg",
  elfenbeinkueste: "ci", "ivory coast": "ci", "cote d'ivoire": "ci",
  england: "gb-eng",
  frankreich: "fr", france: "fr",
  irak: "iq", iraq: "iq",
  iran: "ir",
  irland: "ie", ireland: "ie",
  italien: "it", italy: "it",
  japan: "jp",
  katar: "qa", qatar: "qa",
  kolumbien: "co", colombia: "co",
  kosovo: "xk",
  kroatien: "hr", croatia: "hr",
  marokko: "ma", morocco: "ma",
  mazedonien: "mk", "north macedonia": "mk", macedonia: "mk",
  mexiko: "mx", mexico: "mx",
  neuseeland: "nz", "new zealand": "nz",
  niederlande: "nl", netherlands: "nl",
  nordirland: "gb-nir", "northern ireland": "gb-nir",
  norwegen: "no", norway: "no",
  oesterreich: "at", austria: "at",
  panama: "pa",
  paraguay: "py",
  polen: "pl", poland: "pl",
  portugal: "pt",
  rumaenien: "ro", romania: "ro",
  "saudi-arabien": "sa", "saudi arabia": "sa",
  schottland: "gb-sct", scotland: "gb-sct",
  schweden: "se", sweden: "se",
  schweiz: "ch", switzerland: "ch",
  senegal: "sn",
  slowakei: "sk", slovakia: "sk",
  spanien: "es", spain: "es",
  suedafrika: "za", "south africa": "za",
  suedkorea: "kr", "south korea": "kr", "korea republic": "kr",
  suriname: "sr",
  tschechien: "cz", czechia: "cz", "czech republic": "cz",
  tunesien: "tn", tunisia: "tn",
  tuerkei: "tr", turkey: "tr", "türkiye": "tr",
  ukraine: "ua",
  ungarn: "hu", hungary: "hu",
  uruguay: "uy",
  usa: "us", "united states": "us", "vereinigte staaten": "us",
  wales: "gb-wls",
  haiti: "ht",
  albanien: "al", albania: "al",
};

function codeFor(name) {
  if (!name) return null;
  return CODE_BY_NAME[String(name).trim().toLowerCase()] ?? null;
}

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

// ---------------------------------------------------------------------------
// Quelle 1: OpenLigaDB
// ---------------------------------------------------------------------------

async function fromOpenLigaDB() {
  // Passenden Liga-Shortcut für die WM 2026 finden.
  const leagues = await getJson("https://api.openligadb.de/getavailableleagues");
  const wm = leagues.find((l) => {
    const hay = `${l.leagueName ?? ""} ${l.leagueShortcut ?? ""}`.toLowerCase();
    const season = String(l.leagueSeason ?? "");
    return /world ?cup|weltmeister|wm|fifa/.test(hay) && season.includes("2026");
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
    const status = m.matchIsFinished ? "finished" : "scheduled";
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
        status,
      },
    };
  });
}

// ---------------------------------------------------------------------------
// Quelle 2: fixturedownload.com
// ---------------------------------------------------------------------------

async function fromFixtureDownload() {
  const data = await getJson(
    "https://fixturedownload.com/feed/json/fifa-world-cup-2026"
  );
  return data.map((m) => {
    const homeName = m.HomeTeam ?? "";
    const awayName = m.AwayTeam ?? "";
    const finished = m.HomeTeamScore != null && m.AwayTeamScore != null;
    // Datumsformat dort: "dd/MM/yyyy HH:mm" (UTC).
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

// ---------------------------------------------------------------------------
// Hauptablauf
// ---------------------------------------------------------------------------

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
      console.warn(`… ${name} lieferte keine Spiele, nächste Quelle`);
    } catch (err) {
      console.warn(`… ${name} fehlgeschlagen: ${err.message}`);
    }
  }

  if (!matches) {
    console.warn(
      "⚠ Keine Quelle erreichbar — bestehender Snapshot bleibt unverändert."
    );
    process.exit(0); // Build NICHT abbrechen (PLAN.md 3.4)
  }

  // Chronologisch sortieren (Spiele ohne Datum ans Ende).
  matches.sort((a, b) => {
    if (!a.kickoffUtc) return 1;
    if (!b.kickoffUtc) return -1;
    return a.kickoffUtc.localeCompare(b.kickoffUtc);
  });

  const payload = { updatedAt: new Date().toISOString(), matches };
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log(`✓ ${matches.length} Spiele geschrieben → ${OUT}`);

  if (matches.length !== 104) {
    console.warn(`⚠ Erwartet 104 Spiele, erhalten ${matches.length}.`);
  }
}

main().catch(async (err) => {
  // Letzte Sicherung: niemals den Build crashen lassen.
  console.error("Unerwarteter Fehler:", err);
  try {
    await readFile(OUT, "utf8"); // Snapshot existiert noch -> ok
    console.warn("Bestehender Snapshot bleibt erhalten.");
  } catch {
    console.error("Kein Snapshot vorhanden!");
  }
  process.exit(0);
});
