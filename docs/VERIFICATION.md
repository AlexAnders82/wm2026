# Verifikations-Checkliste — Phase 1 (PLAN.md §8)

Stand der Selbstkontrolle vor Übergabe.

| Prüfung | Ergebnis |
|---|---|
| `npm run build` fehlerfrei | ✅ grün (prebuild: fetch-data + build-ics, dann astro build) |
| Anti-Slop-Wortverbot (PLAN §8 + DS 11) | ✅ keine verbotenen Wörter im `dist/` |
| `.ics` Zeitzonen (MESZ → UTC) | ✅ 19:00 MESZ = 17:00Z, 22:00 MESZ = 20:00Z korrekt |
| Schriften self-hosted, kein Google-CDN | ✅ `@fontsource` gebündelt, kein CDN im HTML |
| `lang="de"`, Canonical/OG absolut | ✅ vorhanden |
| `prefers-reduced-motion` schaltet Motion ab | ✅ im CSS umgesetzt |
| JSON-LD (WebSite, FAQPage, SportsEvent, BroadcastEvent) | ✅ im HTML |
| robots.txt, llms.txt, sitemap, OG-Bild | ✅ im `dist/` |
| JS minimal (Countdown, Filter, Reveal) | ✅ inline, < 5 KB, kein externes Bundle |

## In dieser Sandbox NICHT ausführbar (volle Prüfung im CI/Live)

- **Lighthouse mobile (≥95/≥95/100):** kein Browser-Binary im Build-Container.
  Nach dem ersten Deploy gegen die Live-URL prüfen:
  `npx lighthouse https://alexanders82.github.io/wm2026/ --form-factor=mobile`
- **375-px-Screenshots:** kein Headless-Browser verfügbar. Layout ist strikt
  mobile-first (einspaltig, `container-read` max. 42rem, horizontal scrollbare
  Filter-Chips) nach den DS-Skizzen umgesetzt.

## Datenstand

- Die Sport-APIs sind im Build-Container per Allowlist gesperrt (403). Der
  committete Snapshot enthält die verifizierten deutschen Gruppenspiele.
- **GitHub Actions hat vollen Netzzugang** und füllt beim ersten Lauf alle
  104 Spiele über `scripts/fetch-data.mjs` (OpenLigaDB → Fallbacks).
