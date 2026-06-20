// fetch-tv.mjs — Senderrechte automatisch aus dem Sportschau-Spielplan übernehmen.
// Läuft im CI (voller Netzzugang). Liest die offizielle Übersicht, ordnet jedem
// Spiel ARD/ZDF (Free-TV) bzw. "nur Magenta" zu und schreibt src/data/tv.json.
// Bereits hinterlegte Einträge (z. B. vergangene Spieltage) bleiben erhalten (Merge).

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { codeFor, pairKey } from "../src/lib/teamcodes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TV = resolve(__dirname, "../src/data/tv.json");
const MATCHES = resolve(__dirname, "../src/data/matches.json");
const URL = "https://www.sportschau.de/fussball/fifa-wm-2026/der-spielplan-der-fussball-wm-2026,fifawm-spielplan-100.html";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

async function loadJson(f, fb) { try { return JSON.parse(await readFile(f, "utf8")); } catch { return fb; } }

async function main() {
  const tv = await loadJson(TV, { fallback: { free: null, stream: ["MagentaTV"] }, bySlug: {} });
  tv.bySlug ??= {};
  const matchesData = await loadJson(MATCHES, { matches: [] });

  // pairKey -> slug (für die Zuordnung der Sportschau-Paarungen zu unseren Spielen).
  const slugByPair = new Map();
  for (const m of matchesData.matches ?? []) {
    const pk = pairKey(m.home?.code, m.away?.code);
    if (pk) slugByPair.set(pk, m.slug);
  }

  let html;
  try {
    const res = await fetch(URL, { headers: { "user-agent": UA, "accept-language": "de-DE,de;q=0.9", "accept": "text/html" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (e) {
    console.warn("… Sportschau nicht erreichbar:", e.message, "— tv.json bleibt unverändert.");
    process.exit(0);
  }

  const re = /(\d{2})\.(\d{2})\.(\d{2}):(\d{2})([A-Za-zÀ-ÿ .'’\-]{2,40}?) - ([A-Za-zÀ-ÿ .'’\-]{2,40}?)(ARD\/ZDF|ZDF\/ARD|ARD|ZDF|Magenta)/g;
  let m, parsed = 0, mapped = 0;
  while ((m = re.exec(html))) {
    parsed++;
    const home = m[5].trim(), away = m[6].trim(), bc = m[7];
    const pk = pairKey(codeFor(home), codeFor(away));
    const slug = pk ? slugByPair.get(pk) : null;
    if (!slug) continue;
    if (bc === "Magenta") {
      tv.bySlug[slug] = { free: null, stream: ["MagentaTV"], exclusive: true };
    } else {
      const free = bc.includes("ZDF") && !bc.includes("ARD") ? "ZDF" : bc.includes("ARD") ? "ARD" : bc;
      tv.bySlug[slug] = { free, stream: ["MagentaTV"] };
    }
    mapped++;
  }

  tv._note = "Senderrechte automatisch aus sportschau.de übernommen (fetch-tv.mjs) + manuell ergänzt. free=ARD/ZDF (Free-TV), exclusive=true => nur MagentaTV. Stand: " + new Date().toISOString();
  await writeFile(TV, JSON.stringify(tv, null, 2) + "\n", "utf8");
  console.log(`✓ Sportschau: ${parsed} Paarungen gelesen, ${mapped} Sender zugeordnet → tv.json`);
}

main().catch((e) => { console.error("fetch-tv Fehler:", e); process.exit(0); });
