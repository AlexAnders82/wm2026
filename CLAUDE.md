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
- **scripts/build-ics.mjs** — Kalender-Abo `public/wm2026.ics`. **scripts/build-og.mjs** — statisches OG-Bild (einmalig, nicht im prebuild).
- Der Deploy-Workflow committet `matches.json/tv.json/live.json/weather.json` mit `[skip ci]` zurück.

## Live-Ergebnisse im Browser (ohne Build abzuwarten)
`src/layouts/Base.astro` enthält ein Inline-Skript, das alle ~45 s OpenLigaDB direkt im Browser pollt (Quelle aus `body[data-oldb-source]`) und Karten/Spielseiten mit `data-oldb-id` aktualisiert (Score, LIVE/Beendet, Torschützen). MatchCard hat dafür `data-role="status|score-home|score-away|goals"`.

## Wichtige Dateien
- Seiten: `src/pages/index.astro` (Tagesübersicht/Hero, Spielplan ab heute, Gruppen, TV-Guide, Kalender, FAQ), `src/pages/spiel/[slug].astro` (104 Spielseiten: Ergebnis, Ortszeit-Live-Uhr, Wetter, Form, Torschützen, Aufstellungen, Gruppentabelle, JSON-LD), `impressum.astro`, `datenschutz.astro`.
- Komponenten: `Logo.astro` (buntes WM-Ball-SVG), `Header`, `Footer`, `MatchCard`, `SenderBadge` (Prop `link` — in Karten `link={false}`!), `DayGroup`, `GroupTable`, `Goals`, `Lineups`, `Countdown`, `Flag`.
- Logik: `src/lib/data.js` (Spiele+TV+Gruppen+Tabellen+Live-Status+Goals; Gruppen werden per Union-Find aus den Spielen abgeleitet), `datetime.js` (Europe/Berlin), `teamcodes.mjs` (Name→ISO-Code/Slug/pairKey), `paths.js`, `links.js`, `venues.mjs`.

## So shippt man eine Änderung (Konvention dieser Sessions)
1. Auf Branch `claude/tender-hypatia-p3kyyh` arbeiten (oder neuen Feature-Branch). Vor neuer Arbeit sauber machen: `git fetch origin main && git reset --hard origin/main` (alte Branch-Commits sind via Squash bereits in main; danach `git push --force-with-lease`).
2. Lokal bauen mit `npx astro build` (prebuild-Skripte holen in der Sandbox keine Daten → nutzen committete Snapshots; das ist ok).
3. Commit → push → PR via GitHub-MCP → **squash-merge** nach main.
4. **Deploy stößt NICHT automatisch an** (API-Merge triggert keinen Workflow). Danach Workflow manuell starten: `actions_run_trigger run_workflow` mit `workflow_id: "deploy.yml"`, `ref: "main"`.
5. Squash-Merges lassen den Branch divergieren → beim nächsten Mal Schritt 1 (reset) nutzen, sonst Merge-Konflikte (Daten-JSONs immer „theirs"/main nehmen, Code „ours").

## Verifikation (Sandbox hat KEINEN Browser & ist netzgesperrt)
- Screenshots: `npm i puppeteer --no-save` (Chromium liegt im Cache), `npx astro preview --port PORT` im Hintergrund, dann per Puppeteer screenshoten (Viewport 375 px). **puppeteer vor dem Commit wieder entfernen** (`git checkout package.json package-lock.json`, Hilfsskripte löschen).
- CI-Logs prüfen via GitHub-MCP `get_job_logs`. Externe Seiten (sportschau/FIFA/ZDF) sind aus Sandbox & WebFetch 403 — nur der CI-Runner kommt dran.

## Stand / erledigt
Tasks 1–14 (Phase 1) live. Plus: Gruppentabellen, korrekte TV-Sender (auto aus Sportschau), Wetter, Ortszeit, Team-Form, Torschützen, Live-Updates im Browser, Tagesübersicht, buntes WM-Ball-Logo, Spielplan ohne vergangene Tage.

## OFFEN / als Nächstes
1. **Logo mit Spieler-Silhouette + Favicon:** Der Nutzer stellt eine SVG (Spielerfigur, evtl. Favicon, README) bereit. **Stand: noch NICHT im Repo angekommen** — vor Arbeit prüfen, ob Dateien da sind (z. B. Ordner `logo-zuliefern/` o. ä.). Dann Spielerfigur + bunten WM-Ball im `Logo.astro` kombinieren, **Favicon** setzen (fehlt noch: `<link rel="icon">` in `Base.astro` + Datei in `public/`), Lizenz/Namensnennung beachten (ggf. Footer). Vorab-Screenshot zeigen.
2. **Gelbe/rote Karten:** keine kostenlose Quelle für 2026 → nur mit bezahltem Datentarif (offene Geschäftsentscheidung des Nutzers).
3. **Vollständige TV-Liste / K.o.-Sender:** füllen sich automatisch über fetch-tv, sobald Sportschau sie zeigt.
4. **Impressum:** Platzhalter `[NAME]` etc. in `src/pages/impressum.astro` muss der Nutzer noch füllen.

## Gotchas
- **Keine verschachtelten `<a>`** (MatchCard ist Link → SenderBadge dort `link={false}`), sonst zerlegt der Browser die Karte in leere Kästen.
- Tailwind-v4-Utilities entstehen aus `--color-*`-Token-Namen (z. B. `--color-card` → `bg-card`).
- Mobile (375 px) hat bei Konflikten Vorrang.
