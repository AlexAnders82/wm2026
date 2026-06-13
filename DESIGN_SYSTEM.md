# DESIGN_SYSTEM — Anstoß '26

Verbindlich für jede Generierung. 14-Sektionen-Standard nach `guidelines/landingpage-method.md`. Mobile-first: Jede Spec gilt zuerst für 375 px; Desktop-Angaben sind die Erweiterung.

---

## 1. Brand Positioning

Anstoß '26 ist die schnellste Antwort auf „Wer spielt heute — und wo läuft's?". Kein Sportnachrichten-Portal, kein Wett-Anbieter, keine Fan-Folklore: ein präzises, dunkles Matchday-Tool im Look einer Stadion-Anzeigetafel bei Flutlicht — Information zuerst, in unter 5 Sekunden, mit einem Daumen bedienbar.

**Stilanker (3):** FotMob (Dark Mode — Informationsdichte ohne Lärm) · Onefootball Match-Center (Karten-Klarheit) · Bahnhofs-/Stadion-Anzeigetafeln (tabellarische Typo, tabular-nums, Reduktion).

**Abgrenzung:** Kein kicker/sport1-Portal-Look (Werbebanner-Wüste, Teaser-Grids), kein FIFA-Corporate-Look (Markenrisiko + austauschbar), kein helles „Sommermärchen"-Pastell (wirkt billig auf Sport-Live-Kontext, Abendnutzung).

---

## 2. Design-Prinzipien

1. **Anzeigetafel, nicht Magazin.** Zeit, Teams, Sender — alles andere ist sekundär und sieht auch so aus.
2. **Der Daumen regiert.** Alles Wichtige in der unteren Bildschirmhälfte erreichbar; Touch-Targets ≥ 44 px; ein Spalten-Fluss.
3. **Dunkel ist Funktion.** Flutlicht-Theme, weil abends genutzt; Leuchtfarben (Live-Grün, Senderfarben) tragen Bedeutung — nie Dekoration.
4. **Eine Akzentfarbe pro Aussage.** Grün = live/jetzt. Gold = Deutschland/Countdown. Senderfarben = nur Badges. Nie mischen.
5. **Bewegung bestätigt, unterhält nicht.** Animationen ≤ 600 ms, immer mit Informationszweck (live-Puls, Reveal, Zustandswechsel). Konfetti & Deko-Loops sind verboten.

---

## 3. Color Tokens

### Primitive

| Token | OKLCH | Hex-Fallback | Name |
|---|---|---|---|
| `--color-night` | `oklch(16% 0.03 262)` | `#0B1120` | Nachtblau (Hintergrund) |
| `--color-pitchbox` | `oklch(21% 0.035 262)` | `#131C30` | Karten-Fläche |
| `--color-chalk-line` | `oklch(30% 0.04 262)` | `#22304E` | Linien/Borders |
| `--color-floodlight` | `oklch(95% 0.01 262)` | `#EDF1F8` | Primärtext |
| `--color-steel` | `oklch(72% 0.025 262)` | `#94A1B8` | Sekundärtext |
| `--color-pitch` | `oklch(73% 0.17 152)` | `#2FCB6E` | Rasengrün (live/CTA) |
| `--color-gold` | `oklch(80% 0.14 80)` | `#F0B429` | Gold (DE/Countdown) |
| `--color-magenta` | `oklch(55% 0.24 356)` | `#E20074` | MagentaTV-Badge |
| `--color-ard` | `oklch(55% 0.18 262)` | `#3D6BE0` | ARD-Badge (aufgehellt für Dunkelgrund) |
| `--color-zdf` | `oklch(70% 0.17 50)` | `#F97C1F` | ZDF-Badge |

### Semantic

```css
--color-bg-primary:     var(--color-night);
--color-bg-card:        var(--color-pitchbox);
--color-border:         var(--color-chalk-line);
--color-text-primary:   var(--color-floodlight);
--color-text-secondary: var(--color-steel);
--color-accent-live:    var(--color-pitch);
--color-accent-de:      var(--color-gold);
```

### Usage-Regeln

| Token | Erlaubt | Verboten | Max. Fläche | WCAG auf night |
|---|---|---|---|---|
| `night` | Seitenhintergrund überall | als Textfarbe | 75 % | — |
| `pitchbox` | MatchCards, CTA-Box, FAQ-Items | verschachtelte Karten (Karte-in-Karte) | 20 % | — |
| `floodlight` | Fließtext, Headlines, Zahlen | große Flächen/Buttons | — | 16:1 AAA |
| `steel` | Metadaten (Stadion, Gruppe, Datum) | Headlines, Anstoßzeiten | — | 7:1 AA+ |
| `pitch` | Live-Dot + „LIVE", primäre CTAs, Links, Fokus-Ring | Hintergrundflächen, Headlines | 5 % | 9:1 AAA |
| `gold` | DE-Spiel-Markierung, Countdown-Ziffern, Hero-Akzentwort | CTAs, Fließtext | 5 % | 10:1 AAA |
| Senderfarben | ausschließlich SenderBadge-Hintergrund (weißer Text) | Links, Icons, Deko, Headlines | je < 1 % | Badge-Text weiß ≥ 4.5:1 |

**Verboten projektweit:** Lila/Purple-Gradients, reines Schwarz `#000`, reines Weiß `#FFF` als Fläche, FIFA-Farbwelten (deren Trikot-/Brand-Verläufe).

### Tailwind v4 `@theme`-Block (kopierbar → `src/styles/app.css`)

```css
@import "tailwindcss";

@theme {
  --color-night:      oklch(16% 0.03 262);
  --color-pitchbox:   oklch(21% 0.035 262);
  --color-chalk-line: oklch(30% 0.04 262);
  --color-floodlight: oklch(95% 0.01 262);
  --color-steel:      oklch(72% 0.025 262);
  --color-pitch:      oklch(73% 0.17 152);
  --color-gold:       oklch(80% 0.14 80);
  --color-magenta:    oklch(55% 0.24 356);
  --color-ard:        oklch(55% 0.18 262);
  --color-zdf:        oklch(70% 0.17 50);

  --color-bg-primary:     var(--color-night);
  --color-bg-card:        var(--color-pitchbox);
  --color-border:         var(--color-chalk-line);
  --color-text-primary:   var(--color-floodlight);
  --color-text-secondary: var(--color-steel);
  --color-accent-live:    var(--color-pitch);
  --color-accent-de:      var(--color-gold);
}
```

---

## 4. Typography Tokens

**Stack:** Display **Barlow Condensed** (600/700) — Headlines, Anstoßzeiten, Ergebnisse, Countdown. Body **Barlow** (400/500/600) — alles andere. Eine Familie, sportlicher Broadcast-Charakter, kostenlos. **Self-hosted via `@fontsource/barlow` + `@fontsource/barlow-condensed`** (DSGVO — kein Google-CDN!). Nur benötigte Gewichte laden, `font-display: swap`.

**Zahlen-Regel:** Alle Uhrzeiten, Ergebnisse, Countdowns mit `font-variant-numeric: tabular-nums` — Anzeigetafel-Effekt, kein Zappeln beim Countdown.

Modular Scale 1.25, Hierarchie:

| Stufe | Größe | Font | Verwendung |
|---|---|---|---|
| Hero | `clamp(2.5rem, 10vw, 4.5rem)` | Condensed 700, uppercase | „HEUTE LIVE", H1 |
| Section | `clamp(1.75rem, 6vw, 2.5rem)` | Condensed 700 | Sektions-Headlines |
| Score/Time | `1.5rem`–`2rem` | Condensed 600, tabular | Anstoßzeit/Ergebnis in Karte |
| Body | `1rem` / `1.0625rem` | Barlow 400 | Fließtext |
| Lead | `1.125rem` | Barlow 500 | Sektions-Intro (max. 2 Sätze) |
| Caption | `0.8125rem` | Barlow 500, `tracking 0.08em`, uppercase | Datums-Header, Gruppe, Stadion |

### Tailwind v4 `@theme`-Block (kopierbar)

```css
@theme {
  --font-display: "Barlow Condensed", "Arial Narrow", sans-serif;
  --font-body:    "Barlow", system-ui, sans-serif;

  --text-xs:   0.8125rem;
  --text-sm:   0.875rem;
  --text-base: 1rem;
  --text-md:   1.125rem;
  --text-lg:   1.5rem;
  --text-xl:   2rem;
  --text-2xl:  2.5rem;
  --text-hero: clamp(2.5rem, 10vw, 4.5rem);

  --leading-hero:    1.0;
  --leading-heading: 1.1;
  --leading-body:    1.6;
  --tracking-caption: 0.08em;
}
```

---

## 5. Spacing & Layout

8-px-Basis. **Mobile zuerst festgelegt, Desktop skaliert hoch:**

| Token | Mobile (≤ 640) | Desktop (≥ 1024) | Verwendung |
|---|---|---|---|
| `--space-section` | `4rem` (64) | `7rem` (112) | vertikal zwischen Sektionen |
| `--space-block` | `2rem` (32) | `3rem` (48) | Headline → Inhalt |
| `--space-card-gap` | `0.75rem` (12) | `1rem` (16) | zwischen MatchCards |
| Card-Padding | `1rem` (16) | `1.25rem` (20) | innen |
| Seitenrand | `1rem` (16) | auto | `px-4` |

Container: `max-width: 64rem` (1024), Inhaltslisten (Spielplan) `max-width: 42rem` zentriert — Lesbarkeit vor Flächenfüllung. Header sticky, Höhe 56 px mobile.
**Rhythmus-Regel:** Innerhalb einer Sektion nie mehr als 3 verschiedene Abstandswerte. Datums-Header bekommen `margin-top: 2.5rem`, erste Karte danach `0.75rem` — Gruppierung muss durch Abstand allein erkennbar sein (Gestalt-Prinzip, keine Trennlinien-Inflation).

---

## 6. Grid & Composition

- **Mobile (Standard):** strikt einspaltig. MatchCard = volle Breite. Filter-Chips horizontal scrollbar (`overflow-x: auto`, ohne sichtbare Scrollbar).
- **Desktop:** Spielplan bleibt einspaltig zentriert (42rem); Hero zweiteilig **7/5** (Matchday-Karten / Countdown-Panel); TV-Guide **5/7** (Text / CTA-Box). Asymmetrisch, nie 50/50.
- **NIE gebaut wird:** 12er-Grid mit 3-Spalten-Karten, Masonry, Bento, Karussell/Slider, horizontale Spielplan-Scroller auf Desktop.

---

## 7. Imagery System

**Es gibt keine Fotos.** (FIFA-/Agentur-Rechte, Stock wirkt billig.) Die Bildsprache ist rein grafisch:

| Element | Spec |
|---|---|
| Flutlicht-Glow | 1–2 große `radial-gradient` (pitch bzw. gold, 4–6 % Opacity) im Hero-Hintergrund, fix, nicht animiert |
| Rasenlinien | horizontale 1-px-Linien (`--color-chalk-line`, 30 % Opacity) als dezente Hero-Textur, CSS, kein Bild |
| Flaggen | SVG aus `flag-icons` (npm, MIT), nur benötigte Länder bundeln, rund (`border-radius: 9999px`), 20 px in Karten, 28 px auf Spielseiten, `1px` Border `--color-border` |
| Logo | reine Typo: „ANSTOSS '26" Condensed 700, Apostroph in `--color-pitch`. Kein Icon, kein Ball-Clipart |
| OG-Image | 1200×630, night-Hintergrund, Logo + Claim „Spielplan · Ergebnisse · Wo läuft's?", einmalig statisch |

**Verboten:** Pokal-/Ball-Stockfotos, Jubel-Fotos, FIFA-Assets, Emoji als UI-Grafik (Ausnahme: ⚽ im .ics-Titel), KI-generierte Stadionbilder.

---

## 8. Component Patterns

### 8.1 Header
- **Zweck:** Orientierung + 1-Tap-Sprung zu „Heute".
- **Layout:** `[ANSTOSS '26]----------[Heute][Plan][TV][📅]` — einzeilig, sticky, `bg-night/90` + `backdrop-blur`, Unterkante 1 px `--color-border`.
- **Token:** Logo `--font-display` 1.25rem; Links `--text-sm` steel, aktiv floodlight.
- **Don'ts:** kein Burger-Menü (nur 4 Anker!), kein CTA-Button im Header, keine Schatten.

### 8.2 Hero „Matchday"
- **Zweck:** In 2 Sekunden zeigen, was JETZT zählt.
- **Layout (mobile):**
  ```
  HEUTE LIVE                       ← Hero-Type, uppercase
  Mi, 12. Juni · Spieltag 2        ← Caption steel
  [MatchCard live/next]
  [MatchCard]
  ┌─ Nächstes DE-Spiel ──────────┐
  │ 🇩🇪 in 2T 04:12:33  → Spiel  │  ← gold, tabular-nums
  └──────────────────────────────┘
  ```
- **Logik:** Läuft gerade ein Spiel → Live-Karten zuerst. Sonst nächster Spieltag. DE-Countdown-Panel immer sichtbar bis DE ausscheidet/Finale.
- **Token:** Countdown gold Condensed; Panel `bg-card` mit 1 px gold-Border (einziger Ort mit farbiger Border).
- **Don'ts:** kein Vollbild-Hero (Inhalt muss ohne Scroll sichtbar sein), kein Hintergrundvideo, keine Typewriter-Animation.

### 8.3 MatchCard (Kernkomponente, 3 Zustände)
- **Zweck:** Ein Spiel = eine Zeile-Karte: Teams, Zeit/Stand, Sender — komplett verlinkbar zur Spielseite.
- **Layout (mobile, 100 %):**
  ```
  ┌────────────────────────────────────┐
  │ 18:00  🇩🇪 Deutschland             │
  │  Uhr   🇨🇼 Curaçao        [ARD][M] │
  │ Gruppe E · Houston                 │
  └────────────────────────────────────┘
  ```
  Zeit links als Block (Condensed, tabular), Teams gestapelt, Badges rechts unten, Meta-Zeile Caption steel.
- **Zustände:** `scheduled` (Zeit groß) · `live` (pulsierender pitch-Dot + Minute statt Zeit, Spielstand fett) · `finished` (Endstand, Karte 80 % Opacity, Zeit ersetzt durch „Beendet").
- **DE-Spiele:** 2 px linke Border in gold.
- **Token:** `bg-card`, Radius `0.75rem`, Border 1 px `--color-border`; Hover/Active: Border → steel, `translateY(-1px)`.
- **Don'ts:** keine Schatten-Stapel, keine Vereinslogos/Verbandswappen (Markenrecht — nur Flaggen), kein „VS"-Lettering zwischen Teams, keine zwei CTAs in einer Karte.

### 8.4 DayGroup
- **Zweck:** Tagesweise Gruppierung des Spielplans (deutsche Zeit).
- **Layout:** Sticky-Date-Header (`SA 14. JUNI` Caption uppercase + dünne Linie), darunter Karten. Vergangene Tage als `<details>` eingeklappt („✓ 12. Juni — 4 Spiele, Ergebnisse anzeigen").
- **Don'ts:** kein unendlicher Scroll-Container, kein Tab-Widget pro Woche, kein Datepicker.

### 8.5 SenderBadge
- **Zweck:** Sofort erkennbar, wo das Spiel läuft; Tap = Stream.
- **Layout:** Pill, 24 px hoch, Senderfarbe als Fläche, weißer Text Condensed 600 (`ARD`, `ZDF`, `MagentaTV`). MagentaTV-exklusiv: zusätzlich Caption „nur MagentaTV" in magenta neben der Pill. `tbd`: Outline-Pill „ARD/ZDF".
- **Verhalten:** Link aus `links.json`; bei `affiliate: true` → `rel="sponsored noopener"` + `*`.
- **Don'ts:** keine Senderlogos als Bild, keine Grautöne (Badge trägt immer Senderfarbe), nie mehr als 2 Badges pro Karte.

### 8.6 TV-Guide-Sektion + MagentaTV-CTA
- **Zweck:** Die 60/44-Aufteilung erklären → Haupt-Conversion.
- **Layout:** Kurzer Text (3 Sätze, Zahlen in Condensed), dann CTA-Box: `bg-card`, 1 px magenta-Border, Headline „44 Spiele laufen nur bei MagentaTV", Fakten-Zeile „Flex-Abo · 11 €/Monat · monatlich kündbar", Button „Zum Angebot*" (pitch-Hintergrund? NEIN → Button in magenta, da Sender-Kontext; einzige magenta-Fläche außerhalb Badges).
- **Don'ts:** keine Preisvergleichstabelle, kein Fake-Countdown („Nur noch heute!"), keine Logos.

### 8.7 Kalender-Sektion
- **Zweck:** .ics-Abo = Viral-Mechanik.
- **Layout:** Headline „Alle Spiele in deinem Kalender", 2 Buttons („📅 Kalender abonnieren" webcal / „Link kopieren" mit JS-Clipboard + Toast „Kopiert — ab in die WhatsApp-Gruppe"), darunter `<details>` je „iPhone" / „Android" mit 2-Schritt-Anleitung.
- **Don'ts:** kein QR-Code, keine 6-Schritte-Anleitung, kein App-Store-Gedöns.

### 8.8 Spielseite (Template)
- **Zweck:** Long-tail-SEO-Lander: eine Frage, eine Antwort.
- **Layout:** Breadcrumb (Spielplan → Spiel) · H1 `Deutschland – Curaçao` · Anstoß-Block (Datum + Zeit groß, gold wenn DE) · SenderBadges + Stream-Link · Ergebnis (wenn vorhanden) · Meta (Stadion, Stadt, Runde) · MagentaTV-CTA nur bei Exklusivspielen · „Weitere Spiele an diesem Tag" (max. 3 MatchCards) · zurück.
- **Don'ts:** kein SEO-Textwüsten-Block („Die Fußballweltmeisterschaft 2026 ist…"), keine Kommentare/Social-Embeds, keine Tabs.

### 8.9 FAQ
- **Zweck:** Suchfragen abgreifen (SEO + FAQPage-JSON-LD).
- **Layout:** `<details>`-Liste, Frage Condensed 600, Antwort Body, max. 8 Items.
- **Don'ts:** keine Accordion-JS-Library, keine Marketing-Fragen („Warum ist Anstoß '26 die beste Seite?").

### 8.10 Footer
- **Zweck:** Recht + Vertrauen.
- **Layout:** einspaltig: Logo klein · „Inoffizielle Fan-Seite. Kein Bezug zur FIFA." · Impressum · Datenschutz · Affiliate-Erklärung (1 Satz) · „Datenstand: {updatedAt} Uhr".
- **Don'ts:** keine Sitemap-Linkwand, kein Newsletter, keine Social-Icons (es gibt keine Profile).

---

## 9. Voice & Tone

**Du-Form.** (Fan-Kontext, mobile Nutzung, Zielgruppe quer durch alle Alter — „Sie" wirkt wie Behörde.)
**Tonalitätsanker:** Stadionansage — knapp, präzise, trocken-warm. Informiert wie ein Kumpel, der die Sender auswendig kennt, nicht wie ein Werbetexter.

| Falsch | Richtig |
|---|---|
| „Erlebe das ultimative Fußballfest live!" | „Heute drei Spiele. Zwei davon nur bei MagentaTV." |
| „Verpasse kein Highlight der WM 2026!" | „Alle 104 Spiele, alle Sender, deutsche Anstoßzeiten." |
| „Jetzt den unvergesslichen Moment sichern!" | „Anstoß 21:00 Uhr im ZDF." |
| „Unsere innovative Kalender-Lösung" | „Einmal abonnieren — jedes Spiel steht in deinem Kalender." |
| „Wir freuen uns, dich begrüßen zu dürfen!" | (ersatzlos streichen) |

---

## 10. Copy-Patterns

- **Headline-Formel:** Die Fan-Frage als knappe Antwort. „Heute live" · „Wo läuft die WM?" · „Alle Spiele in deinem Kalender". Nie Frage-Headlines mit „?" stapeln, nie Ausrufezeichen.
- **CTA-Verben-Whitelist:** *ansehen · abonnieren · kopieren · zum Stream · zum Angebot · zum Spielplan*. Verboten: *entdecken, sichern, erleben, loslegen, jetzt klicken*.
- **Zahlen ausspielen:** „104 Spiele", „44 nur bei MagentaTV", „11 €/Monat" — Zahlen sind das Vertrauenssignal dieser Seite, immer konkret, nie „viele Spiele".
- **Meta-Description-Pattern (Spielseiten):** `{Heim} – {Gast} am {Datum} um {Zeit} Uhr: Übertragung live im/bei {Sender}. Anstoßzeit, Stadion & Ergebnis.`

---

## 11. Anti-AI-Slop-Negativkatalog

### Verbotene Wörter (zusätzlich zur Baseline aus landingpage-method.md §3.1)

| Wort | Warum |
|---|---|
| ultimativ, mega, episch | Boulevard-Lärm, zerstört Anzeigetafel-Ton |
| Fußballfest, Sommermärchen | abgegriffene WM-Floskeln seit 2006 |
| Gänsehaut, hautnah, live dabei | Sport-Marketing-Slop |
| Top-Spiele, Kracher, Knaller | Boulevard |
| verpasse nicht / nicht verpassen | FOMO-Pattern |
| Emojis im UI-Text | (Ausnahmen: ⚽ im .ics-Titel, 📅 Kalender-Button, Flaggen sind SVG) |

### Verbotene Patterns
Konfetti-/Partikel-Animationen · Flaggen-Emoji-Reihen · Purple-Gradients · Bento/Masonry/Karussell · Icon-Walls · animierte Zähler („0→104 Spiele") · Glassmorphism-Karten · Fake-Urgency („Nur heute!") · Newsletter-Popup · Cookie-Banner (nicht nötig — Seite ist tracker-frei) · Sterne-Bewertungen · „In 3 Schritten"-Sektionen.

### Verbotene Tech
Google-Fonts-CDN (self-host!) · Tracking ohne Auftrag · React/Next für diese statische Seite · Tailwind-v3-Patterns (`tailwind.config.js`, `@tailwind base`) · jQuery/Bootstrap · Bilder-CDNs von Dritten.

---

## 12. Asset-Inventar & Stammdaten

**Turnier:** 11. Juni – 19. Juli 2026 · 104 Spiele · 48 Teams · USA/Mexiko/Kanada, 16 Spielorte · Anstoßzeiten i. d. R. 18:00–03:00 MESZ.
**Sender (Stand 12.6.2026, in Session verifizieren):** MagentaTV alle 104, davon 44 exklusiv; ARD/ZDF 60 im Free-TV; DE-Spiele, Eröffnung, Halbfinals, Finale immer Free-TV. MagentaTV Flex: 11 €/Monat, monatlich kündbar.
**DE-Gruppenspiele (MESZ):** Sa 14.6. 19:00 DE–Curaçao (ARD) · Sa 20.6. 22:00 DE–Elfenbeinküste (ZDF) · Do 25.6. 22:00 Ecuador–DE (ARD). Alle zusätzlich MagentaTV.
**Links:** ausschließlich über `src/data/links.json` (siehe PLAN §5) — nie hart kodieren.
**Impressum:** `[NAME] · [STRASSE] · [PLZ ORT] · [E-MAIL]` — Platzhalter, Alex liefert nach Launch sofort.
**Claim:** „Spielplan · Ergebnisse · Wo läuft's?"
**Es existieren keine Bild-Assets** — alles grafisch per CSS/SVG (Sektion 7).

---

## 13. Pflicht-Skill & Motion-Spec

**Skills (falls in der Session verfügbar):** `frontend-design` (Pflicht bei Generierung), `web-animation` (Motion), `seo-landingpage` (Audit). Nicht verfügbar → dieses DS ist die vollständige Ersatz-Spezifikation; strikt befolgen.

**Motion-Tokens (verbindlich):**
```css
--ease-out:   cubic-bezier(0.22, 1, 0.36, 1);
--dur-fast:   150ms;   /* Hover, Taps */
--dur-base:   300ms;   /* Reveals, Zustandswechsel */
--dur-slow:   600ms;   /* Hero-Einstieg */
```
**Erlaubte Animationen (vollständige Liste):**
1. **Live-Puls:** 8-px-Dot, `box-shadow`-Ping, 2 s Loop — der einzige Dauer-Loop der Seite.
2. **Scroll-Reveal:** Sektionen/Karten `opacity 0→1` + `translateY(12px→0)`, `--dur-base`, gestaffelt max. 60 ms, einmalig (IntersectionObserver, < 1 KB).
3. **Hero-Einstieg:** Headline + erste Karte, `--dur-slow`, nur beim Laden.
4. **Countdown:** Ziffernwechsel ohne Animation (tabular-nums verhindert Zappeln) — bewusst statisch.
5. **Taps/Hover:** Karten `translateY(-1px)` + Border-Aufhellung, `--dur-fast`.
6. **View Transitions** (Astro) zwischen Startseite ↔ Spielseite, Standard-Crossfade.

**Pflicht:** `@media (prefers-reduced-motion: reduce)` deaktiviert 1–3 und 6 komplett (Live-Dot wird statisch, Inhalte sofort sichtbar).

---

## 14. How to use this in der Coding-Session

1. **Reihenfolge:** Erst `@theme`-Blöcke (Sektion 3 + 4) nach `src/styles/app.css` kopieren, dann Komponenten exakt nach Sektion 8 bauen — Tokens vor Komponenten, Komponenten vor Seiten.
2. **Beispiel-Prompts intern:** „Baue MatchCard nach DS 8.3 — alle 3 Zustände, Don'ts beachten" · „Hero nach DS 8.2, Mobile-Skizze ist die Wahrheit".
3. **Stopp-Pattern:** Entsteht etwas, das nach Sektion 11 verboten ist (Icon-Wall, 3-Spalten-Grid, Marketing-Sprech) → Komponente verwerfen und gegen die Layout-Skizze neu bauen. Nicht „verschlimmbessern".
4. **Selbst-Audit vor Übergabe:** 375-px-Screenshot jeder Sektion gegen die ASCII-Skizzen; grep-Wortverbot (PLAN §8); Reduced-Motion-Test; Lighthouse mobile ≥ 95/95/100.
5. **Außerhalb dieses DS:** Geschäftslogik, Datenpipeline, SEO-Technik → PLAN.md. Bei Widerspruch zwischen DS und PLAN gilt: PLAN für Funktion, DS für Form.
