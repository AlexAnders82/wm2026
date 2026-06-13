// teamcodes.mjs — Team-Namen -> ISO-Code + Slug. Von mehreren Skripten genutzt
// (fetch-data, fetch-live). Robuste Normalisierung (Umlaute, Akzente, EN/DE-Namen).

/** URL-tauglichen Slug aus einem Namen bauen (Akzente/Umlaute entfernt). */
export function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/&/g, "und")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Teamname (DE oder EN) -> ISO-3166-alpha-2 (UK-Nationen: flag-icons-Subcodes).
const CODE_BY_NAME = {
  argentinien: "ar", argentina: "ar",
  australien: "au", australia: "au",
  belgien: "be", belgium: "be",
  bolivien: "bo", bolivia: "bo",
  brasilien: "br", brazil: "br",
  "bosnien-herzegowina": "ba", "bosnien und herzegowina": "ba", bosnia: "ba", "bosnia and herzegovina": "ba",
  "kap verde": "cv", "cape verde": "cv", kapverde: "cv",
  kanada: "ca", canada: "ca",
  "costa rica": "cr",
  curacao: "cw", "curaçao": "cw",
  daenemark: "dk", denmark: "dk",
  deutschland: "de", germany: "de",
  ecuador: "ec",
  aegypten: "eg", egypt: "eg",
  elfenbeinkueste: "ci", "ivory coast": "ci", "cote d'ivoire": "ci",
  england: "gb-eng",
  frankreich: "fr", france: "fr",
  ghana: "gh",
  irak: "iq", iraq: "iq",
  iran: "ir",
  irland: "ie", ireland: "ie",
  italien: "it", italy: "it",
  japan: "jp",
  jordanien: "jo", jordan: "jo",
  katar: "qa", qatar: "qa",
  kolumbien: "co", colombia: "co",
  kongo: "cd", "dr kongo": "cd", "dr-kongo": "cd", "congo dr": "cd", "dr congo": "cd",
  kosovo: "xk",
  kroatien: "hr", croatia: "hr",
  algerien: "dz", algeria: "dz",
  marokko: "ma", morocco: "ma",
  mazedonien: "mk", "north macedonia": "mk", macedonia: "mk", nordmazedonien: "mk",
  mexiko: "mx", mexico: "mx",
  neuseeland: "nz", "new zealand": "nz",
  niederlande: "nl", netherlands: "nl",
  nordirland: "gb-nir", "northern ireland": "gb-nir",
  norwegen: "no", norway: "no",
  oesterreich: "at", austria: "at",
  panama: "pa",
  paraguay: "py",
  polen: "pl", poland: "pl",
  portugal: "pt",
  rumaenien: "ro", romania: "ro",
  "saudi-arabien": "sa", "saudi arabien": "sa", "saudi arabia": "sa",
  schottland: "gb-sct", scotland: "gb-sct",
  schweden: "se", sweden: "se",
  schweiz: "ch", switzerland: "ch",
  senegal: "sn",
  slowakei: "sk", slovakia: "sk",
  spanien: "es", spain: "es",
  suedafrika: "za", "south africa": "za",
  suedkorea: "kr", "south korea": "kr", "korea republic": "kr",
  suriname: "sr",
  tschechien: "cz", czechia: "cz", "czech republic": "cz",
  tunesien: "tn", tunisia: "tn",
  tuerkei: "tr", turkey: "tr", "türkiye": "tr", turkiye: "tr",
  ukraine: "ua",
  ungarn: "hu", hungary: "hu",
  uruguay: "uy",
  usa: "us", "united states": "us", "vereinigte staaten": "us",
  usbekistan: "uz", uzbekistan: "uz",
  wales: "gb-wls",
  haiti: "ht",
  albanien: "al", albania: "al",
};

/** Name -> ae/oe/ue, Akzente weg, nur a-z0-9. */
export function norm(s) {
  return String(s)
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

const NORM_CODE = Object.fromEntries(
  Object.entries(CODE_BY_NAME).map(([k, v]) => [norm(k), v])
);

/** Teamname (DE/EN) -> ISO-Code oder null. */
export function codeFor(name) {
  if (!name) return null;
  return NORM_CODE[norm(name)] ?? null;
}

/** Stabiler Schlüssel für eine Paarung (sortiertes Code-Paar), sprachunabhängig. */
export function pairKey(codeA, codeB) {
  if (!codeA || !codeB) return null;
  return [codeA, codeB].sort().join("__");
}
