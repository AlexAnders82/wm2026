# Nächste Schritte — „Anstoß '26"

Stand: Funktions-Erweiterung (Teams, Live, Stadien, Tor-Zeitstrahl, Turnier) + Bilder sind
**live auf `main`**. Diese Datei hält die offenen Aufgaben für kommende Sessions fest.
Übersicht/Konventionen: siehe `CLAUDE.md`.

## 1. Etappe F (groß): Hosting auf Vercel + DSGVO/Cookie-Banner
Ziel des Nutzers: „offiziell machen".
- **Astro-Config:** `astro.config.mjs` `base` → `/` (statt `/wm2026`), `site` → Vercel-/Wunsch-Domain.
  `public/site.webmanifest` enthält noch **hartkodierte `/wm2026/`-Pfade** → auf `href()`/Base umstellen.
  Interne Links laufen schon über `src/lib/paths.js` (`href`) → passen sich an.
- **Domain:** Entscheidung des Nutzers (Vercel-Subdomain oder eigene Domain + DNS).
- **Daten-Refresh:** bestehende **GitHub-Action** stündlich Snapshots committen lassen → Vercel
  deployt automatisch bei Push auf `main` (Vercel-Build-Command nur `astro build`, **ohne** den
  Netz-Fetch; `fetch-tv` liest die Sportschau weiterhin nur vom GitHub-Runner). So bleibt der
  Datenfluss erhalten, ohne dass Vercel die Fetches selbst macht.
- **DSGVO:** Seite ist cookie-/trackingfrei (Stadion-Karte lädt OSM erst auf Klick) → ein Banner
  ist rechtlich vermutlich **nicht zwingend**. Wenn gewünscht: **leichtgewichtiges, selbst
  gehostetes** Consent-Banner (kein OneTrust/Drittanbieter) + aktualisierte Datenschutzerklärung.
- **Impressum:** Platzhalter `[NAME]` … in `src/pages/impressum.astro` füllen (Nutzer-Angaben).

## 2. Stadion-Fotos — Polish
- **Logo statt Foto:** Wikipedia-`pageimage` lieferte bei `att-stadium` und `hard-rock-stadium`
  das Vereins-/Stadion-**Logo** (SVG). `scripts/fetch-stadium-images.mjs` lehnt SVG/„logo"-Dateien
  jetzt ab → diese Stadien zeigen den generischen Platzhalter. Optional: echte Commons-Fotos
  hand-picken (Dateititel im Skript als Override hinterlegen oder Bild manuell in `public/stadien/`
  + Eintrag in `src/data/stadium-credits.json`).
- **Format:** einige Fotos sind PNG (`att`, `bmo`, `hard-rock`) → ggf. zu WebP/JPEG verkleinern.
- **Bildnachweis-Sammelseite:** alle CC-Credits gebündelt (z. B. unter Datenschutz/Impressum).
- Re-Fetch passiert automatisch beim nächsten Deploy (Skript ist idempotent: nur fehlende Stadien).

## 3. Optionale KI-Bilder (Stil: cinematic & dunkel)
Nur falls gewünscht — 3 dezente Section-Header (`public/bilder/header-stadien.webp` etc.).
**ChatGPT-Image-Specs:** Querformat **1536×1024**, 1 Bild pro Prompt, kein Text/keine Logos.
**Stil-Suffix an jeden Prompt anhängen:**
> cinematic, dark navy night palette around #0B1120, moody volumetric stadium floodlight haze,
> subtle emerald-green and gold accents, deep shadows, photorealistic, no text, no logos,
> generous dark empty negative space in the upper-left for overlay text, wide 3:2 composition

Danach: auf ~1600 px verkleinern, als WebP (Q ~80, < ~200 KB) in `public/bilder/`.
(Hero `hero.webp` und Platzhalter `stadion-fallback.webp` sind bereits eingebaut.)

## 4. Läuft automatisch / keine Aktion nötig
- **K.-o.-Runde:** `turnier.astro` + KO-Spielseiten füllen sich, sobald OpenLigaDB die KO-Spiele
  liefert (`phase==="ko"`). Aktuell nur 72 Gruppenspiele in `src/data/matches.json`.
- **TV-Sender / K.o.-Sender:** kommen automatisch über `fetch-tv`, sobald die Sportschau sie zeigt.

## 5. Bekannte Grenzen
- **Gelbe/rote Karten + Detail-Statistik** (Ballbesitz, Schüsse): keine kostenlose Datenquelle für
  2026 → nur mit bezahltem Tarif (Geschäftsentscheidung). Tor-Zeitstrahl nutzt vorhandene `goals`.
