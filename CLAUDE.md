# CLAUDE.md — Projekt-Übergabe „Anstoß '26" (WM-2026-Seite)

Diese Datei wird von neuen Claude-Code-Sessions automatisch gelesen. Sie fasst
alles zusammen, was man braucht, um nahtlos weiterzuarbeiten.

## Produkt
Mobile-first, werbe- & cookiefreie Fan-Seite zur Fußball-WM 2026.
- **Live:** https://alexanders82.github.io/wm2026/
- **Repo:** AlexAnders82/wm2026 · **Live-Branch:** `main` (GitHub Pages via GitHub Actions)
- **Sprache:** Deutsch. Code-Kommentare deutsch. Zielgruppe ist technischer Laie → in Laien-Sprache antworten, am Ende „Das musst du tun"-Liste (max. 3 Punkte).
- Maßgeblich: `PLAN.md` (Funktion) und `DESIGN_SYSTEM.md` (Form). Bei Widerspruch: PLAN für Funktion, DS für Form. **Ausdrückliche Nutzerwünsche schlagen das DS** (z. B. das bunte Logo — DS wollte reine Typo).

## Stack
Astro 5 (statisch) · Tailwind CSS 4 (CSS-first `@theme` in `src/styles/app.css`, KEIN config.js) · self-hosted Fonts (@fontsource Barlow/Barlow Condensed) · flag-icons · GitHub Pages + Actions. Astro `base: "/wm2026"` → interne Links über `src/lib/paths.js` (`href()`).

## Datenpipeline (läuft im CI = voller Netzzugang; lokale Sandbox ist netzgesperrt)
`npm run build` ruft `prebuild` auf: `fetch-data → fetch-tv → fetch-live → fetch-weather → build-ics → astro build`.
- **scripts/fetch-data.mjs** — Spielplan/Ergebnisse/**Torschützen** von OpenLigaDB (Liga-Shortcut `wm26`, Saison 2026). Ergänzt Stadien aus fixturedownload.com. Schreibt `src/data/matches.json` (inkl. `oldbId`, `goals`, `source`). Bricht bei Netzfehler nie ab (committeter Snapshot bleibt).
- **scripts/fetch-tv.mjs** — liest den **Sportschau-Spielplan** (NUR vom CI-Runner lesbar! WebFetch/Sandbox bekommen 403) und parst pro Spiel ARD/ZDF/Magenta → `src/data/tv.json` (Merge, bestehende Einträge bleiben). Regex-Muster: `DD.MM.HH:MMHeim - Gast{Sender}`.
- **scripts/fetch-live.mjs** — Aufstellungen best-effort von TheSportsDB (kostenlos, community, oft lückenhaft) → `src/data/live.json`. (API-Football scheitert: Gratis-Tarif hat **keine** Saison 2026.)
- **scripts/fetch-weather.mjs** — Open-Meteo (kostenlos) für Spiele in den nächsten ~60 h → `src/data/weather.json`. Koordinaten/Zeitzonen der 16 Stadien in `src/lib/venues.mjs`.
- **scripts/fetch-stadium-images.mjs** — holt je Stadion ein frei lizenziertes Foto von Wikipedia/Wikimedia Commons (Commons-Thumbnail ~1280 px) → `public/stadien/<slug>.jpg|png` + Bildnachweis (Autor/Lizenz/Quelle) → `src/data/stadium-credits.json`. Nur mit Autor/Lizenz (CC-Nachweispflicht), **idempotent** (vorhandene werden übersprungen), bricht den Build nie ab. (Bekanntes Problem: Wikipedia-`pageimage` liefert bei manchen Stadien das **Vereins-/Stadion-Logo** statt eines Fotos → das Skript lehnt SVG/„logo"-Dateien ab; Stadien ohne Foto zeigen den generischen Platzhalter `public/bilder/stadion-fallback.webp`.)
- **scripts/build-ics.mjs** — Kalender-Abo `public/wm2026.ics`. **scripts/build-og.mjs** — statisches OG-Bild (einmalig, nicht im prebuild).
- Der Deploy-Workflow committet `matches.json/tv.json/live.json/weather.json` **+ `src/data/stadium-credits.json` + `public/stadien/`** mit `[skip ci]` zurück.

## Live-Ergebnisse im Browser (ohne Build abzuwarten)
`src/layouts/Base.astro` enthält ein Inline-Skript, das alle ~45 s OpenLigaDB direkt im Browser pollt (Quelle aus `body[data-oldb-source]`) und Karten/Spielseiten mit `data-oldb-id` aktualisiert (Score, LIVE/Beendet, Torschützen). MatchCard hat dafür `data-role="status|score-home|score-away|goals"`.

## Wichtige Dateien
- Seiten: `src/pages/index.astro` (Live-Rubrik bei laufenden Spielen, Hero mit Bild-Hintergrund + Spieltag-Pille, Tagesübersicht, Spielplan ab heute, Gruppen, TV-Guide, Kalender, FAQ), `src/pages/spiel/[slug].astro` (Spielseiten: Ergebnis, Ortszeit-Live-Uhr, **Tor-Zeitstrahl**, Wetter, Form, Torschützen, Aufstellungen, Gruppentabelle, JSON-LD), `src/pages/mannschaften.astro` (alle Teams nach Gruppe), `src/pages/team/[code].astro` (Team-Seite: Spiele, Bilanz, Gruppentabelle), `src/pages/stadien.astro` + `src/pages/stadion/[slug].astro` (16 Stadien: Foto, Daten, Karte-auf-Klick, Spiele), `src/pages/turnier.astro` (Gruppen + K.-o.-Gerüst), `impressum.astro`, `datenschutz.astro`.
- Komponenten: `Logo.astro` (Badge-Bild „Anstoß '26"), `Header` (Nav: Heute·Plan·Teams·Stadien·Turnier·TV), `Footer`, `MatchCard` (**Stretched-Link**, s. Gotchas), `TeamLink` (Flagge+Name → Team-Seite), `SenderBadge` (Prop `link` — in Karten `link={false}`!), `DayGroup`, `GroupTable` (`table-fixed`), `Goals`, `GoalTimeline` (Tor-Zeitstrahl), `Lineups`, `Countdown`, `Flag`, `StadiumMap` (OSM erst auf Klick), `StadiumThumb` (Foto oder Platzhalter).
- Logik: `src/lib/data.js` (Spiele+TV+Gruppen+Tabellen+Live-Status+Goals; Gruppen per Union-Find; zusätzlich `getTeams/getTeamByCode/getTeamMatches`, `currentMatchdayLabel`), `datetime.js` (Europe/Berlin), `teamcodes.mjs` (Name→ISO-Code/Slug/pairKey), `paths.js`, `links.js`, `venues.mjs` (16 Stadien inkl. `name/country/capacity/surface/slug` + `matchCity`/`venueBySlug`).
- Bilder/Daten: `src/data/stadium-credits.json` (Bildnachweise, vom CI gefüllt), `public/stadien/` (Stadion-Fotos), `public/bilder/hero.webp` (Startseiten-Hero), `public/bilder/stadion-fallback.webp` (generischer Stadion-Platzhalter).

## So shippt man eine Änderung (Konvention dieser Sessions)
1. Auf dem zugewiesenen Feature-Branch arbeiten (zuletzt `claude/funny-allen-ydqh2g`; `main` ist die Quelle der Wahrheit). Vor neuer Arbeit sauber machen: `git fetch origin main && git reset --hard origin/main` (alte Branch-Commits sind via Squash bereits in main; danach `git push --force-with-lease`).
2. Lokal bauen mit `npx astro build` (prebuild-Skripte holen in der Sandbox keine Daten → nutzen committete Snapshots; das ist ok).
3. Commit → push → PR via GitHub-MCP → **squash-merge** nach main.
4. **Deploy stößt NICHT automatisch an** (API-Merge triggert keinen Workflow). Danach Workflow manuell starten: `actions_run_trigger run_workflow` mit `workflow_id: "deploy.yml"`, `ref: "main"`.
5. Squash-Merges lassen den Branch divergieren → beim nächsten Mal Schritt 1 (reset) nutzen, sonst Merge-Konflikte (Daten-JSONs immer „theirs"/main nehmen, Code „ours").

## Verifikation (Sandbox hat KEINEN Browser & ist netzgesperrt)
- Screenshots: `npm i puppeteer --no-save` (Chromium liegt im Cache), `npx astro preview --port PORT` im Hintergrund, dann per Puppeteer screenshoten (Viewport 375 px). **puppeteer vor dem Commit wieder entfernen** (`git checkout package.json package-lock.json`, Hilfsskripte löschen).
- CI-Logs prüfen via GitHub-MCP `get_job_logs`. Externe Seiten (sportschau/FIFA/ZDF) sind aus Sandbox & WebFetch 403 — nur der CI-Runner kommt dran.

## Stand / erledigt
Phase 1 (Tasks 1–14) + Gruppentabellen, TV-Sender (auto), Wetter, Ortszeit, Team-Form, Torschützen, Live-Updates im Browser, Tagesübersicht, Spielplan ohne vergangene Tage. **Logo-Badge „Anstoß '26" + Favicon/App-Icons + gebrandetes OG-Bild live.**
**Große Funktions-Erweiterung (live):**
- **Mannschaften überall anklickbar** (MatchCard, Tabellen, Listen via `TeamLink`) → Team-Seiten `/team/<code>` (Spiele, Bilanz, Gruppentabelle) + Übersicht `/mannschaften`.
- **Live-Rubrik** „Jetzt live" (bei laufenden Spielen) + **Spieltag-Pille** „Spieltag N · Gruppenphase" im Hero.
- **Stadien:** `/stadien` + `/stadion/<slug>` mit **echten Wikimedia-Fotos** (CC, Nachweis), Daten und **Karte (lädt OSM erst auf Klick → bleibt cookie-/trackingfrei)**.
- **Tor-Zeitstrahl** (`GoalTimeline`) auf jeder Spielseite.
- **Turnier-Seite** `/turnier` (alle Gruppen + Tabellen + K.-o.-Gerüst, füllt sich automatisch).
- **Bilder:** Hero-Hintergrund + generischer Stadion-Platzhalter (KI, self-hosted), 16 Stadion-Fotos via CI.

## OFFEN / als Nächstes  → Details in `docs/naechste-schritte.md`
1. **Etappe F (groß): Umzug zu Vercel + DSGVO/Cookie-Banner** — „offiziell machen". `base` → `/`, Domain, Daten-Refresh-Strategie, leichtgewichtiges Consent-Banner (kein OneTrust). Siehe `docs/naechste-schritte.md`.
2. **Impressum:** Platzhalter `[NAME]` etc. in `src/pages/impressum.astro` muss der Nutzer füllen.
3. **Stadion-Fotos-Polish:** `att-stadium`/`hard-rock-stadium` lieferten zuletzt das **Logo** statt Foto (Skript lehnt Logos jetzt ab → generischer Platzhalter); ggf. echte Commons-Fotos hand-picken. PNG-Fotos (att/bmo/hard-rock) ggf. zu WebP verkleinern. Sammel-Bildnachweis-Seite.
4. **Gelbe/rote Karten & Detail-Statistik (Ballbesitz/Schüsse):** keine kostenlose Quelle für 2026 → nur mit bezahltem Datentarif.
5. **K.o.-Daten:** Turnier-Gerüst + KO-Spielseiten füllen sich automatisch, sobald `matches.json` `phase==="ko"` enthält.
6. **Optional:** 3 Section-Header-KI-Bilder (Prompts in `docs/naechste-schritte.md`).

## Gotchas
- **Keine verschachtelten `<a>`.** `MatchCard` ist ein **Stretched-Link**: Wurzel = `<div class="match-card">`, ein abdeckender `<a class="match-card__link">` (`::after{inset:0}`, z-index 1) öffnet das Spiel; Team-Links (`.team-link`, z-index 2) liegen darüber. Live-/Filter-Hooks (`data-oldb-id`, `data-role`, `data-phase`, `data-de`) sitzen auf dem `<div>`. `SenderBadge` in Karten `link={false}`.
- **Mannschafts-Links überall** über `TeamLink` (nie rohe `<a>` in Karten verschachteln).
- **Stadion-Karte (`StadiumMap`)** lädt OpenStreetMap **erst auf Klick** (DSGVO; kein Banner nötig). Diesen Ansatz beibehalten, wenn weitere externe Inhalte dazukommen.
- Tailwind-v4-Utilities entstehen aus `--color-*`-Token-Namen (z. B. `--color-card` → `bg-card`).
- Mobile (375 px) hat bei Konflikten Vorrang.
