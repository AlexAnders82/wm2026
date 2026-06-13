# Anstoß '26 — WM 2026 Spielplan & TV-Guide

Mobile-first, werbe- und cookiefreie Fan-Seite zur Fußball-WM 2026. Beantwortet
zwei Fragen in unter 5 Sekunden: **Wer spielt wann (deutsche Zeit)** und
**wo läuft's (ARD / ZDF / MagentaTV)?**

- **Live-URL (nach Deploy):** https://alexanders82.github.io/wm2026/
- **Stack:** Astro 5 (statisch) · Tailwind CSS 4 · GitHub Pages · GitHub Actions
- **Daten:** stündlich automatisch via OpenLigaDB (mit Fallbacks), kein Server, 0 € Betrieb

---

## Für den Betreiber — die wichtigsten Handgriffe

### 1. Impressum ausfüllen (Pflicht, vor dem Teilen)
Datei `src/pages/impressum.astro` öffnen und die Platzhalter ersetzen:
`[NAME]`, `[STRASSE]`, `[PLZ ORT]`, `[E-MAIL]`. Speichern → die Seite baut sich
automatisch neu.

### 2. Affiliate-Link später eintauschen
Alle externen Links stehen zentral in **`src/data/links.json`**. Sobald der
Telekom-/Awin-Werbelink da ist: bei `magentatv` die `url` ersetzen und
`"affiliate": true` setzen. Den Rest (Sternchen `*` + `rel="sponsored"`) macht
die Seite automatisch.

### 3. Sender-Korrekturen
Wer ein Spiel zeigt, steht in **`src/data/tv.json`** (Schlüssel = Spiel-Slug).
Fehlt ein Spiel, wird automatisch „nur MagentaTV" angezeigt (faktisch korrekt).

---

## Lokal entwickeln

```bash
npm install
npm run dev      # Vorschau auf http://localhost:4321/wm2026/
npm run build    # holt Daten, baut .ics, erzeugt die statische Seite nach dist/
```

## Wie das Automatische funktioniert
`.github/workflows/deploy.yml` läuft bei jedem Push auf `main` **und stündlich**:
holt frische Ergebnisse, baut das Kalender-Abo (`wm2026.ics`) und die Seite,
deployt zu GitHub Pages und committet den aktuellen Datenstand zurück.

> Inoffizielle Fan-Seite. Kein Bezug zur FIFA.
