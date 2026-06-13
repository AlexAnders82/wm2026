// datetime.js — alle Zeiten nach Europe/Berlin (MESZ) konvertieren und
// deutsch formatieren (PLAN.md 1: Quelldaten meist UTC -> immer Berlin + "Uhr").
// Tagesgruppierung erfolgt nach deutscher Zeit (US-Anstoßzeiten reichen bis 03:00).

const TZ = "Europe/Berlin";

/** Liefert die Datums-Teile eines UTC-ISO-Strings in Berliner Zeit. */
function parts(iso) {
  const d = new Date(iso);
  const fmt = new Intl.DateTimeFormat("de-DE", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const map = {};
  for (const p of fmt.formatToParts(d)) map[p.type] = p.value;
  return map;
}

/** Stabiler Tagesschlüssel (YYYY-MM-DD) in Berliner Zeit — für Gruppierung. */
export function dayKey(iso) {
  const d = new Date(iso);
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(d); // z. B. "2026-06-14"
}

/** "19:00" (24h, Berliner Zeit). */
export function timeLabel(iso) {
  if (!iso) return "";
  const p = parts(iso);
  return `${p.hour}:${p.minute}`;
}

/** Tages-Header für DayGroup: "SA · 14. JUNI" (Caption, uppercase). */
export function dayHeader(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const wd = new Intl.DateTimeFormat("de-DE", { timeZone: TZ, weekday: "short" })
    .format(d)
    .replace(".", "")
    .toUpperCase();
  const p = parts(iso);
  return `${wd} · ${p.day}. ${p.month.toUpperCase()}`;
}

/** Vollständiges Datum: "Samstag, 14. Juni 2026". */
export function fullDate(iso) {
  if (!iso) return "";
  const p = parts(iso);
  return `${cap(p.weekday)}, ${p.day}. ${p.month} ${p.year}`;
}

/** Datum + Zeit für Spielseite/Hero: "Sa, 14. Juni · 19:00 Uhr". */
export function dateTimeLabel(iso) {
  if (!iso) return "Termin offen";
  const d = new Date(iso);
  const wd = new Intl.DateTimeFormat("de-DE", { timeZone: TZ, weekday: "short" })
    .format(d)
    .replace(".", "");
  const p = parts(iso);
  return `${cap(wd)}, ${p.day}. ${p.month} · ${p.hour}:${p.minute} Uhr`;
}

/** Kurzes Datum ohne Wochentag: "14. Juni 2026". */
export function shortDate(iso) {
  if (!iso) return "";
  const p = parts(iso);
  return `${p.day}. ${p.month} ${p.year}`;
}

/** Datenstand für Footer: "13.06.2026, 02:00". */
export function stampLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const fmt = new Intl.DateTimeFormat("de-DE", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return fmt.format(d).replace(",", ",");
}

/** Restzeit als Anzeigetafel-String: "2 T 04:12:33" bzw. "04:12:33". */
export function fmtRemaining(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "Anpfiff!";
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (n) => String(n).padStart(2, "0");
  return days > 0
    ? `${days} T ${p(h)}:${p(m)}:${p(s)}`
    : `${p(h)}:${p(m)}:${p(s)}`;
}

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
