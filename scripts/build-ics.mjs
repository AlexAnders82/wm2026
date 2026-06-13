// build-ics.mjs — erzeugt public/wm2026.ics aus matches.json + tv.json (PLAN.md 3.5).
// Das Kalender-Abo ist das virale Artefakt: jeder Eintrag verlinkt zurück auf die Spielseite.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = "https://alexanders82.github.io/wm2026";
const OUT = resolve(__dirname, "../public/wm2026.ics");

function escapeText(s) {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** ISO-UTC -> "YYYYMMDDTHHMMSSZ". */
function icsDate(iso) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Zeilen auf 75 Oktette falten (RFC 5545), CRLF + Leerzeichen. */
function fold(line) {
  const out = [];
  let s = line;
  while (s.length > 73) {
    out.push(s.slice(0, 73));
    s = " " + s.slice(73);
  }
  out.push(s);
  return out.join("\r\n");
}

async function main() {
  let data;
  try {
    data = JSON.parse(await readFile(resolve(__dirname, "../src/data/matches.json"), "utf8"));
  } catch (err) {
    console.error("build-ics: matches.json nicht lesbar —", err.message);
    process.exit(0); // Build nicht abbrechen
  }
  let tv = { bySlug: {}, fallback: { free: null, stream: ["MagentaTV"] } };
  try {
    tv = JSON.parse(await readFile(resolve(__dirname, "../src/data/tv.json"), "utf8"));
  } catch {
    /* Fallback bleibt */
  }

  const stamp = icsDate(new Date().toISOString());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Anstoss 26//WM 2026//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Anstoß '26 – WM 2026",
    "NAME:Anstoß '26 – WM 2026",
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
  ];

  let count = 0;
  for (const m of data.matches ?? []) {
    if (!m.kickoffUtc) continue;
    const sender = tv.bySlug?.[m.slug] ?? tv.fallback;
    const freeSender = sender.free && sender.free !== "none" && sender.free !== "tbd" ? sender.free : null;
    const channels = [...(freeSender ? [freeSender] : []), ...(sender.stream ?? [])];
    const tag = freeSender || (sender.stream?.[0] ?? "");
    const start = new Date(m.kickoffUtc);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const url = `${SITE}/spiel/${m.slug}/`;
    const loc = [m.venue?.stadium, m.venue?.city, m.venue?.country].filter(Boolean).join(", ");
    const summary = `⚽ ${m.home?.name} – ${m.away?.name}${tag ? ` (${tag})` : ""}`;
    const desc = `Übertragung: ${channels.join(", ") || "MagentaTV"}\nSpielseite: ${url}`;

    lines.push(
      "BEGIN:VEVENT",
      fold(`UID:${m.id}@wm2026`),
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDate(start.toISOString())}`,
      `DTEND:${icsDate(end.toISOString())}`,
      fold(`SUMMARY:${escapeText(summary)}`),
      ...(loc ? [fold(`LOCATION:${escapeText(loc)}`)] : []),
      fold(`DESCRIPTION:${escapeText(desc)}`),
      fold(`URL:${url}`),
      "END:VEVENT"
    );
    count++;
  }

  lines.push("END:VCALENDAR");
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, lines.join("\r\n") + "\r\n", "utf8");
  console.log(`✓ ${count} Termine geschrieben → ${OUT}`);
}

main();
