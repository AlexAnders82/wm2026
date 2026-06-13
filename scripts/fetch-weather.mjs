// fetch-weather.mjs — aktuelles Wetter am Spielort (Open-Meteo, kostenlos, kein Key).
// Nur für Spiele in den nächsten ~60 Stunden (PLAN.md Phase 2). Pro Stadt 1 Abruf.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { codeFor, pairKey } from "../src/lib/teamcodes.mjs";
import { matchCity } from "../src/lib/venues.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../src/data/weather.json");

// WMO-Wettercode -> kurzer deutscher Text.
const WMO = {
  0: "klar", 1: "überwiegend klar", 2: "teils bewölkt", 3: "bewölkt",
  45: "Nebel", 48: "Reifnebel", 51: "leichter Niesel", 53: "Niesel", 55: "starker Niesel",
  61: "leichter Regen", 63: "Regen", 65: "starker Regen", 66: "gefr. Regen", 67: "gefr. Regen",
  71: "leichter Schnee", 73: "Schnee", 75: "starker Schnee", 77: "Schneegriesel",
  80: "Regenschauer", 81: "Schauer", 82: "starke Schauer", 85: "Schneeschauer", 86: "Schneeschauer",
  95: "Gewitter", 96: "Gewitter mit Hagel", 99: "Gewitter mit Hagel",
};

async function loadJson(file, fallback) {
  try { return JSON.parse(await readFile(file, "utf8")); } catch { return fallback; }
}

async function main() {
  const matchesData = await loadJson(resolve(__dirname, "../src/data/matches.json"), { matches: [] });
  const live = await loadJson(resolve(__dirname, "../src/data/live.json"), { venues: {} });
  const matches = matchesData.matches ?? [];

  const now = Date.now();
  const out = {};
  const cityCache = new Map(); // city -> {tempC, text}

  for (const m of matches) {
    if (!m.kickoffUtc) continue;
    const t = new Date(m.kickoffUtc).getTime();
    if (t < now - 3 * 3.6e6 || t > now + 60 * 3.6e6) continue; // nur Fenster
    const k = pairKey(m.home?.code, m.away?.code);
    const cityText = live.venues?.[k]?.city || m.venue?.city || m.venue?.stadium || "";
    const v = matchCity(cityText);
    if (!v) continue;

    if (!cityCache.has(v.city)) {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${v.lat}&longitude=${v.lon}&current=temperature_2m,weather_code&timezone=UTC`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        cityCache.set(v.city, {
          tempC: Math.round(j.current?.temperature_2m ?? NaN),
          text: WMO[j.current?.weather_code] ?? "",
          city: v.city,
        });
      } catch (e) {
        console.warn(`… Wetter ${v.city} fehlgeschlagen:`, e.message);
        cityCache.set(v.city, null);
      }
    }
    const w = cityCache.get(v.city);
    if (w && Number.isFinite(w.tempC)) out[m.slug] = w;
  }

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`✓ Wetter für ${Object.keys(out).length} Spiele geschrieben`);
}

main().catch((e) => { console.error("fetch-weather Fehler:", e); process.exit(0); });
