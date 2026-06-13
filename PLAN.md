# PLAN — Anstoß '26 (WM-2026-Seite)

Vollständiger Umsetzungsplan. Die Coding-Session arbeitet diesen Plan **sequentiell** ab (Abschnitt 9: Phase 1, Task 1–14). Bei Designfragen gilt [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) — nicht nachfragen, DS befolgen. Bei echten Blockern (z. B. Datenquelle tot): stoppen und Alex in einfachen Worten erklären.

---

## 0. Ziel & Erfolgskriterien

**Produkt:** Statische, mobile-first Website, die drei Fan-Fragen in unter 5 Sekunden beantwortet:
1. Wer spielt **heute/morgen** — und um wie viel Uhr deutscher Zeit?
2. **Wo läuft das Spiel** (ARD / ZDF / MagentaTV) — mit direktem Link zum Stream?
3. Wie ist der komplette Spielplan / wie ging Spiel X aus?

**Erfolgskriterien (verifizierbar):**
- Seite live unter `https://alexanders82.github.io/wm2026/`
- Ergebnisse aktualisieren sich stündlich ohne menschliches Zutun
- Alle 104 Spiele haben eine eigene SEO-Unterseite
- Kalender-Abo (.ics) funktioniert auf iPhone + Android
- Lighthouse mobile: Performance ≥ 95, Accessibility ≥ 95, SEO 100
- Kein Cookie-Banner nötig (keine Tracker, keine Cookies)

**Nicht-Ziele (Phase 1):** Gruppentabellen-Visualisierung, K.o.-Baum-Grafik, Wetter, Aufstellungen, Produkt-Affiliate-Sektion, AdSense. (→ Phase 2/3)

---

## 1. Rahmenbedingungen

| Faktor | Konsequenz |
|---|---|
| Turnier läuft bereits (11.6.–19.7.2026) | MVP muss in **einer** Coding-Session live gehen. Lieber Phase 2 streichen als Phase 1 verzögern. |
| Betreiber ist technischer Laie | Null laufende Wartung. Alles Automatische in GitHub Actions. Jede manuelle Stelle (Affiliate-Link-Tausch) in **einer** Datei (`src/data/links.json`) mit Kommentar. |
| > 80 % Mobile-Traffic | Mobile-first: Bei jedem Layout-Konflikt gewinnt 375 px-Viewport. Desktop ist die Anpassung, nicht umgekehrt. |
| Budget 0 € | GitHub Pages (Repo muss **public** sein), kostenlose Daten-APIs, Google Fonts, keine Paid-Services. |
| Zeiten | Quelldaten meist UTC → **immer nach Europe/Berlin (MESZ) konvertieren** und „Uhr" anzeigen. US-Spielorte = späte Anstoßzeiten (18:00–03:00 MESZ) — Tagesgruppierung nach deutscher Zeit. |

---

## 2. Stack & Architektur

| Schicht | Entscheidung | Begründung |
|---|---|---|
| Framework | **Astro 5** (Static Output) | Methodik-Default; 104 Seiten aus JSON generieren ist Astros Kernfall |
| Styling | **Tailwind CSS 4** (CSS-first `@theme`) | Tokens aus DS Sektion 3/4 per Copy-Paste; **keine v3-Patterns** (kein `tailwind.config.js`!) |
| Animation | Native CSS (`@keyframes`, `@starting-style`, View Transitions) + kleiner IntersectionObserver für Scroll-Reveal | Kein Framer Motion (kein React), kein GSAP |
| Hosting | **GitHub Pages** | Abweichung vom Netlify-Default — begründet: stündlicher Auto-Rebuild braucht CI, GitHub Actions + Pages ist eine Plattform, ein Login, 0 € |
| CI | **GitHub Actions**: Build bei Push + Cron stündlich | siehe 3.4 |
| Sprache | Deutsch (DACH-Zielgruppe) | `lang="de"` |

**Astro-Konfiguration (Stolperfalle!):** GitHub Pages liefert unter Unterpfad aus →
```js
// astro.config.mjs
site: 'https://alexanders82.github.io',
base: '/wm2026',
```
Alle internen Links/Assets über `import.meta.env.BASE_URL` bzw. Astro-Helpers. Absolute URLs (Canonical, OG, ICS, JSON-LD) immer voll qualifiziert.

**Repo-Struktur:**
```
wm2026/
├── astro.config.mjs
├── package.json
├── scripts/
│   ├── fetch-data.mjs      # API → src/data/matches.json (Snapshot committen!)
│   └── build-ics.mjs       # → public/wm2026.ics
├── src/
│   ├── styles/app.css      # @theme-Blöcke aus DS
│   ├── data/
│   │   ├── matches.json    # Spielplan + Ergebnisse (Snapshot, wird von CI überschrieben)
│   │   ├── tv.json         # Sender-Zuordnung pro Spiel (manuell kuratiert, statisch)
│   │   └── links.json      # ALLE externen/Affiliate-Links zentral
│   ├── components/         # MatchCard, SenderBadge, DayGroup, Countdown, …
│   ├── layouts/Base.astro  # Meta, OG, Fonts, JSON-LD-Slot
│   └── pages/
│       ├── index.astro
│       ├── spiel/[slug].astro   # 104 Spielseiten via getStaticPaths
│       ├── impressum.astro
│       └── datenschutz.astro
└── .github/workflows/deploy.yml
```

---

## 3. Datenpipeline

### 3.1 Quelle für Spielplan + Ergebnisse (ERSTER Task der Coding-Session: live verifizieren!)

Reihenfolge testen, erste funktionierende Quelle nehmen:

1. **OpenLigaDB** — `https://api.openligadb.de/getavailableleagues` nach WM 2026 durchsuchen (Shortcut vermutlich `wm` o. ä., Season `2026`), dann `getmatchdata/{shortcut}/2026`. Kostenlos, kein Key, JSON, deutsche Teamnamen, Limit 1000 req/h.
2. **fixturedownload.com** — `https://fixturedownload.com/feed/json/fifa-world-cup-2026`. Kostenlos, kein Key.
3. **football-data.org** — Competition `WC`, Free-Tier. Braucht kostenlosen API-Key → wäre ein GitHub-Secret (`FOOTBALL_DATA_TOKEN`); Alex bekommt dann eine Klick-Anleitung. Nur falls 1+2 ausfallen.

**Hinweis:** Im Planungs-Container war ausgehender Traffic auf eine Allowlist beschränkt — die Quellen konnten nicht final verifiziert werden. Die Coding-Session MUSS das als Erstes tun (dort bzw. spätestens in GitHub Actions besteht voller Netzzugang).

### 3.2 Normalisiertes Datenformat (`matches.json`)

```json
{
  "updatedAt": "2026-06-12T14:00:00Z",
  "matches": [{
    "id": "m37",
    "slug": "deutschland-curacao",
    "round": "Gruppe E",
    "kickoffUtc": "2026-06-14T17:00:00Z",
    "home": { "name": "Deutschland", "code": "de" },
    "away": { "name": "Curaçao", "code": "cw" },
    "venue": { "stadium": "...", "city": "...", "country": "..." },
    "score": { "home": null, "away": null, "status": "scheduled" }
  }]
}
```
`status`: `scheduled | live | finished`. `code` = ISO-3166-alpha-2 für SVG-Flaggen. Slug-Schema: `{heim}-{gast}`, bei K.o.-Platzhaltern `af-1-sieger-gruppe-a` o. ä. — Slugs sind **stabil** (URLs ändern sich nie, auch wenn Teams feststehen → dann Redirect/Alias ergänzen oder Slug erst bei Feststehen erzeugen; pragmatisch: K.o.-Seiten erst generieren, wenn Paarung feststeht, vorher zeigt der Spielplan sie ohne Link).

### 3.3 Sender-Zuordnung (`tv.json`) — manuell kuratiert

Es gibt **keine API** dafür. Die Coding-Session recherchiert per Websuche die offizielle Aufteilung (Quellen: sport1.de, heise.de, t-online — „WM 2026 Übertragung welcher Sender") und schreibt pro Spiel-ID:
```json
{ "m37": { "free": "ARD", "stream": ["MagentaTV"] } }
```
Regeln (Stand 12.6.2026, verifizieren): MagentaTV zeigt **alle 104** Spiele, 44 davon **exklusiv**; ARD/ZDF zusammen 60 im Free-TV. Deutschland-Spiele, Eröffnung, Halbfinals, Finale immer Free-TV. DE-Gruppenspiele: 14.6. 19:00 ARD (DE–Curaçao), 20.6. 22:00 ZDF (DE–Elfenbeinküste), 25.6. 22:00 ARD (Ecuador–DE), alle MESZ.
K.o.-Spiele, deren Sender noch nicht final verteilt ist: `"free": "tbd"` → UI zeigt „ARD oder ZDF — wird kurz vorher bekanntgegeben" + immer MagentaTV.
Fallback, falls Recherche für einzelne Spiele nichts ergibt: nur MagentaTV anzeigen (faktisch immer korrekt).

### 3.4 Automatisierung (`.github/workflows/deploy.yml`)

Ein Workflow, zwei Trigger:
```yaml
on:
  push: { branches: [main] }
  schedule: [{ cron: "17 * * * *" }]   # stündlich, Minute 17 (Load-Spitzen meiden)
  workflow_dispatch:
```
Job: Checkout → Node 20 → `npm ci` → `node scripts/fetch-data.mjs` (bei API-Fehler: **nicht abbrechen**, committeter Snapshot wird verwendet) → `node scripts/build-ics.mjs` → `astro build` → `actions/upload-pages-artifact` → `actions/deploy-pages`. Concurrency-Group gegen überlappende Deploys. Frisch geholte `matches.json` zusätzlich zurück ins Repo committen (git-auto-commit oder `git commit || true`), damit der Snapshot aktuell bleibt.

### 3.5 Kalender-Abo (`wm2026.ics`)

`scripts/build-ics.mjs` generiert ein VCALENDAR mit allen Spielen: Titel `⚽ Deutschland – Curaçao (ARD)`, Zeit in UTC mit korrekter Konvertierung, `LOCATION` Stadion/Stadt, `DESCRIPTION` mit Link zur Spielseite, `URL`, stabile `UID`s (`m37@wm2026`), `REFRESH-INTERVAL` + `X-PUBLISHED-TTL: PT6H`. Abo-Link auf der Seite als `webcal://alexanders82.github.io/wm2026/wm2026.ics` **und** https-Link, mit 2-Schritt-Anleitung je iPhone/Android (siehe DS, Komponente 7). Das ist das virale Artefakt — jeder Kalendereintrag verlinkt zurück auf die Seite.

---

## 4. Seitenstruktur

### 4.1 Startseite `/` (eine lange, scrollbare Seite)

| # | Sektion | Inhalt |
|---|---|---|
| 1 | Header | Logo „ANSTOSS '26", Anker-Nav (Heute · Spielplan · TV-Guide · Kalender), sticky, schlank |
| 2 | Hero „Matchday" | Live-Spiele JETZT (falls vorhanden) bzw. nächstes DE-Spiel mit Countdown; darunter „Heute & Morgen"-MatchCards |
| 3 | Spielplan | Alle Spiele, gruppiert nach Tag (deutsche Zeit), Filter-Chips: Alle · 🇩🇪 Deutschland · Gruppenphase · K.o.-Runde. Vergangene Tage eingeklappt (`<details>`) |
| 4 | TV-Guide | „Wo läuft die WM?" — Aufteilung 60 Free-TV / 44 exklusiv MagentaTV erklärt, Sender-Links, **MagentaTV-CTA-Box** (Flex-Abo, 11 €/Mon., monatlich kündbar) ← Haupt-Monetarisierung |
| 5 | Kalender | .ics-Abo mit Anleitung iPhone/Android + „Teile den Link in deiner WhatsApp-Gruppe" |
| 6 | FAQ | 6–8 echte Suchfragen („Wo läuft das Finale?", „Was kostet MagentaTV?", „Welche Spiele sind nicht im Free-TV?") als `<details>`, FAQPage-JSON-LD |
| 7 | Footer | Impressum · Datenschutz · Affiliate-Hinweis · „Inoffizielle Fan-Seite, kein Bezug zur FIFA" |

### 4.2 Spielseiten `/spiel/[slug]/` (104×, programmatisch)

Title-Pattern: `Deutschland – Curaçao live: Übertragung, Anstoßzeit & Ergebnis | WM 2026`.
Inhalt: Anstoß (deutsche Zeit, groß), SenderBadges + Stream-Link, Stadion/Stadt, Ergebnis (sobald vorhanden), Gruppenzuordnung, „weitere Spiele an diesem Tag", Rück-Link Spielplan, MagentaTV-CTA falls Exklusivspiel. JSON-LD: `SportsEvent` + `BroadcastEvent`. **Das ist die einzige realistische SEO-Chance** (Long-tail „wer zeigt ecuador deutschland") — Meta-Descriptions pro Spiel individuell generieren.

### 4.3 Rechtsseiten

- `/impressum/` — Platzhalter `[NAME]`, `[STRASSE]`, `[PLZ ORT]`, `[E-MAIL]` deutlich markiert; Alex füllt sie (siehe KICKOFF, Schritt „Nach dem Launch").
- `/datenschutz/` — ehrlich & kurz: statische Seite, GitHub Pages als Hoster (Server-Logs durch GitHub/Fastly), Google Fonts **self-hosted** (DSGVO! → `@fontsource` Pakete statt Google-CDN), keine Cookies, keine Tracker, Affiliate-Links gekennzeichnet.

---

## 5. Monetarisierung

1. **Zentrale Link-Datei `src/data/links.json`** — jeder externe Link läuft hierüber:
   ```json
   {
     "magentatv": { "url": "https://www.telekom.de/magenta-tv/fussball-wm", "affiliate": false, "label": "MagentaTV" },
     "ard": { "url": "https://www.ardmediathek.de/live", "affiliate": false },
     "zdf": { "url": "https://www.zdf.de/live-tv", "affiliate": false }
   }
   ```
   Sobald Alex' Telekom-Affiliate-Link (Awin) da ist: nur `url` + `affiliate: true` tauschen → Komponenten setzen dann automatisch `rel="sponsored noopener"` und das Sternchen „*Werbelink".
2. **Sichtbare Kennzeichnung:** Affiliate-Links mit `*`, Erklärung im Footer („*Werbelink: Kauf/Abo kostet dich keinen Cent mehr, unterstützt aber diese Seite"). Pflicht (UWG/Medienstaatsvertrag).
3. **Phase 2:** Amazon-PartnerNet-Sektion „WM im Garten" (Beamer, Leinwand, Kühlbox) — kuratierte 3er-Liste, redaktionell, kein Karten-Grid-Slop.
4. **AdSense:** frühestens Phase 3, nur unauffällige Platzierungen — erst wenn Traffic da ist (vorher kostet es nur Optik). Achtung: AdSense erzwingt Cookie-Consent → bewusste Entscheidung später.

---

## 6. SEO & AI-SEO

- **Meta:** individuelle Titles/Descriptions (Patterns in 4.2), Canonical absolut, OG-Tags + ein statisches OG-Bild (1200×630, dunkles Flutlicht-Design mit Logo — per `canvas-design` oder schlicht in Build).
- **JSON-LD:** Startseite `WebSite` + `FAQPage`; Spielseiten `SportsEvent` (mit `homeTeam`/`awayTeam`/`startDate`/`location`) + `BroadcastEvent` (`publishedOn`: ARD/ZDF/MagentaTV) — maschinenlesbar = AI-SEO: genau das Format, das KI-Assistenten zitieren.
- **`sitemap.xml`** (`@astrojs/sitemap`), **`robots.txt`** (alles erlaubt), **`llms.txt`** im Root: 10 Zeilen, was die Seite ist + Kernfakten (Sender-Aufteilung, Datenstand) — kostet nichts, hilft KI-Crawlern.
- **Interne Verlinkung:** Spielplan → Spielseiten → „Spiele am selben Tag" → zurück. Keine Orphan-Pages.
- **Performance = Ranking:** statisch, self-hosted Fonts mit `font-display: swap`, SVG-Flaggen inline/sprite, kein JS außer Countdown + Reveal (< 5 KB).

---

## 7. Rechtliches (hart einhalten)

1. **FIFA-Marken:** Kein offizielles Logo, kein Maskottchen, kein „FIFA World Cup 26™"-Schriftzug, keine offiziellen Grafiken/Fotos. Beschreibende Nutzung „WM 2026" ok. Footer-Disclaimer: „Inoffizielle Fan-Seite. Kein Bezug zur FIFA. Alle Markennamen gehören ihren Eigentümern."
2. **Keine Streams einbetten, keine Highlight-Videos hosten** — ausschließlich Links auf offizielle Anbieter.
3. **Senderlogos:** NICHT als Bilddateien verwenden (Markenrecht) → Text-Badges in Senderfarben (DS Komponente 5).
4. **Impressum + Datenschutz** ab Tag 1 (siehe 4.3). **Affiliate-Kennzeichnung** (siehe 5).
5. **Fonts self-hosted** (kein Google-CDN → keine IP-Übertragung, DSGVO-sauber, kein Banner).

---

## 8. Phasen

### Phase 1 — MVP (EINE Coding-Session, Reihenfolge verbindlich)

| # | Task | Verifikation |
|---|---|---|
| 1 | Datenquelle live testen (3.1), `fetch-data.mjs` schreiben, `matches.json`-Snapshot committen | JSON enthält 104 Spiele mit Datum/Teams |
| 2 | `tv.json` recherchieren + kuratieren (3.3) | Jedes Spiel hat Sender; DE-Spiele stimmen mit 3.3 überein |
| 3 | Astro 5 + Tailwind 4 Setup, `app.css` mit DS-`@theme`-Blöcken, `base`-Konfig | `npm run build` grün |
| 4 | `Base.astro` Layout (Meta, Fonts self-hosted, Skip-Link, Footer) | — |
| 5 | Komponenten: SenderBadge, MatchCard (3 Zustände), DayGroup, Countdown | Visuell gegen DS Sektion 8 |
| 6 | Startseite Sektionen 1–3 (Header, Hero/Matchday, Spielplan + Filter) | 375 px-Screenshot sauber |
| 7 | Startseite Sektionen 4–7 (TV-Guide + CTA, Kalender, FAQ, Footer) | — |
| 8 | 104 Spielseiten (`getStaticPaths`) + JSON-LD | Stichprobe 3 Seiten |
| 9 | `build-ics.mjs` + Kalender-Sektion verdrahten | .ics validiert (z. B. icalendar.org-Validator-Format prüfen) |
| 10 | Impressum + Datenschutz + llms.txt + sitemap + robots | — |
| 11 | Animationen + `prefers-reduced-motion` (DS Sektion „Motion") | Reduced-Motion-Test |
| 12 | `deploy.yml` (3.4) | Action läuft grün, Seite live |
| 13 | Verifikations-Checkliste (unten) komplett | alles grün |
| 14 | Abschlussbericht an Alex in Laien-Sprache: URL, was er jetzt tun muss (Impressum!), wie er Affiliate-Links später tauscht | — |

**Verifikations-Checkliste (vor Übergabe, alle Punkte):**
```bash
npm run build                              # fehlerfrei
grep -irE "premium|exklusives erlebnis|unvergesslich|einzigartig|ultimativ|mega|fußballfest|gänsehaut|hautnah" dist/ || echo OK
npx lighthouse <live-url> --form-factor=mobile   # ≥95/≥95/100
# Reduced Motion manuell prüfen; 375px-Viewport aller Sektionen prüfen
# .ics in Apple/Google-Kalender-Logik gegengeprüft (Zeitzonen!)
```

### Phase 2 — nach Launch (eigene Session, nur wenn Phase 1 live)

Gruppentabellen (aus Ergebnissen berechnet) · K.o.-Baum-Visualisierung · Wetter am Spielort für Spiele < 24 h (Open-Meteo, kein Key) · „WM im Garten"-Amazon-Sektion · OG-Images pro Spielseite.

### Phase 3 — Skalierung

Eigene Domain + Umzug (Redirects!) · AdSense-Entscheidung · Telekom/Awin- & Amazon-Links scharf schalten · EM-2028-Recycling vorbereiten.

---

## 9. Coding-Session: Modell & Arbeitsweise

- **Modell: Sonnet 4.6.** Begründung: Plan + DS sind vollspezifiziert, Umsetzung ist gut definierte Fleißarbeit; spart Alex' Pro-Kontingent (~⅓ des Verbrauchs von Fable/Opus). Falls in der Session nicht wählbar: bestes verfügbares Modell nehmen.
- **Arbeitsweise:** Tasks 1–14 strikt in Reihenfolge. Pro Task ein Commit mit klarer Message. Nach Task 6 und 13 je einen Mobile-Screenshot (falls Browser-Tooling verfügbar) zur Selbstkontrolle gegen DS.
- **Entscheidungshoheit:** Design-/Tech-Detailfragen → DS/PLAN entscheiden lassen, nicht Alex fragen. Alex nur fragen bei: Geschäftsentscheidungen, Rechtlichem außerhalb Abschnitt 7, toten Datenquellen.
- **Kommunikation mit Alex:** Laien-Sprache, keine Fachbegriffe ohne Halbsatz-Erklärung, am Ende klare „Das musst du jetzt tun"-Liste (max. 3 Punkte).
- **Optionales Design-Review danach:** neue kurze Session mit Opus/Fable: „Review der Live-Seite gegen DESIGN_SYSTEM.md, Liste konkreter Verbesserungen" — billig, hoher Hebel.
