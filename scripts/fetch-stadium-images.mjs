// scripts/fetch-stadium-images.mjs — holt je Stadion ein frei lizenziertes Foto von
// Wikipedia/Wikimedia Commons und speichert Bild + Bildnachweis (Autor/Lizenz/Quelle).
// Läuft NUR im CI (Netzzugang). Idempotent: bereits vorhandene Bilder werden übersprungen.
// Bricht den Build nie ab (best effort).
import { VENUES } from "../src/lib/venues.mjs";
import { writeFile, mkdir, readFile, access } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = "public/stadien";
const CREDITS = "src/data/stadium-credits.json";
const WIDTH = 1280;
const UA = "Anstoss26/1.0 (WM-2026-Fanseite; +https://github.com/AlexAnders82/wm2026)";

// Abweichende Wikipedia-Artikeltitel (sonst = venue.name).
const WIKI_TITLE = { "arrowhead-stadium": "Arrowhead Stadium" };
const LANGS = ["de", "en"]; // erst deutsche, dann englische Wikipedia

const fileExists = async (p) => { try { await access(p); return true; } catch { return false; } };
const loadCredits = async () => { try { return JSON.parse(await readFile(CREDITS, "utf8")); } catch { return {}; } };
const stripHtml = (s) => String(s || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

async function api(host, params) {
  const url = `https://${host}/w/api.php?` + new URLSearchParams({ format: "json", origin: "*", ...params });
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.json();
}

async function fetchOne(venue) {
  const title = WIKI_TITLE[venue.slug] || venue.name;
  for (const lang of LANGS) {
    try {
      // 1) Repräsentatives Seitenbild (Thumbnail) der Wikipedia-Seite.
      const q = await api(`${lang}.wikipedia.org`, {
        action: "query", prop: "pageimages", piprop: "thumbnail|name",
        pithumbsize: String(WIDTH), titles: title, redirects: "1",
      });
      const page = Object.values(q?.query?.pages || {})[0];
      const thumb = page?.thumbnail?.source;
      const fileName = page?.pageimage;
      if (!thumb || !fileName) continue;

      // 2) Lizenz/Autor des Files von Commons (Pflicht: nur mit Nachweis verwenden).
      let author = "", license = "", licenseUrl = "", descUrl = "";
      try {
        const info = await api("commons.wikimedia.org", {
          action: "query", titles: "File:" + fileName, prop: "imageinfo", iiprop: "extmetadata|url",
        });
        const ii = Object.values(info?.query?.pages || {})[0]?.imageinfo?.[0];
        const em = ii?.extmetadata || {};
        author = stripHtml(em.Artist?.value);
        license = stripHtml(em.LicenseShortName?.value);
        licenseUrl = em.LicenseUrl?.value || "";
        descUrl = ii?.descriptionurl || "";
      } catch { /* Lizenzinfo best effort */ }

      // Ohne Lizenz/Autor lieber den Platzhalter behalten (CC verlangt Nachweis).
      if (!license && !author) continue;

      // 3) Bild herunterladen.
      const ext = (thumb.split("?")[0].match(/\.(jpe?g|png)$/i)?.[1] || "jpg").toLowerCase().replace("jpeg", "jpg");
      const img = await fetch(thumb, { headers: { "User-Agent": UA } });
      if (!img.ok) continue;
      const buf = Buffer.from(await img.arrayBuffer());
      const file = `${venue.slug}.${ext}`;
      await writeFile(path.join(OUT_DIR, file), buf);

      return {
        file, author, license, licenseUrl,
        sourceUrl: descUrl || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      };
    } catch { /* nächste Sprache versuchen */ }
  }
  return null;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const credits = await loadCredits();
  let changed = 0;
  for (const v of VENUES) {
    const have = credits[v.slug]?.file && (await fileExists(path.join(OUT_DIR, credits[v.slug].file)));
    if (have) continue;
    const res = await fetchOne(v);
    if (res) { credits[v.slug] = res; changed++; console.log("✓", v.slug, "→", res.file, `(${res.license || "?"})`); }
    else console.warn("✗ kein Bild gefunden:", v.slug);
  }
  if (changed) await writeFile(CREDITS, JSON.stringify(credits, null, 2) + "\n");
  console.log(`Stadien-Bilder: ${changed} neu · gesamt ${Object.keys(credits).length}/${VENUES.length}`);
}

main().catch((e) => { console.error("fetch-stadium-images:", e.message); process.exit(0); });
