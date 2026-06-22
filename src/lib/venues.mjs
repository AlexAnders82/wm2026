// venues.mjs — die 16 WM-2026-Austragungsorte mit Koordinaten + Zeitzone und
// statischen Stadion-Fakten (Name, Land, Kapazität, Rasen). Für Wetter (Open-Meteo),
// Ortszeit auf der Spielseite und die Stadien-Seiten.

export const VENUES = [
  { city: "Mexiko-Stadt", name: "Estadio Azteca", slug: "estadio-azteca", country: "Mexiko", capacity: 87000, surface: "Naturrasen", lat: 19.303, lon: -99.150, tz: "America/Mexico_City", aliases: ["mexico city", "ciudad de mexico", "azteca", "mexiko"] },
  { city: "Guadalajara", name: "Estadio Akron", slug: "estadio-akron", country: "Mexiko", capacity: 46000, surface: "Naturrasen", lat: 20.681, lon: -103.463, tz: "America/Mexico_City", aliases: ["guadalajara", "zapopan", "akron"] },
  { city: "Monterrey", name: "Estadio BBVA", slug: "estadio-bbva", country: "Mexiko", capacity: 53500, surface: "Naturrasen", lat: 25.669, lon: -100.244, tz: "America/Monterrey", aliases: ["monterrey", "guadalupe", "bbva"] },
  { city: "Toronto", name: "BMO Field", slug: "bmo-field", country: "Kanada", capacity: 45500, surface: "Naturrasen", lat: 43.633, lon: -79.418, tz: "America/Toronto", aliases: ["toronto", "bmo"] },
  { city: "Vancouver", name: "BC Place", slug: "bc-place", country: "Kanada", capacity: 54500, surface: "Kunstrasen", lat: 49.277, lon: -123.112, tz: "America/Vancouver", aliases: ["vancouver", "bc place"] },
  { city: "Atlanta", name: "Mercedes-Benz Stadium", slug: "mercedes-benz-stadium", country: "USA", capacity: 71000, surface: "Kunstrasen", lat: 33.755, lon: -84.401, tz: "America/New_York", aliases: ["atlanta", "mercedes-benz"] },
  { city: "Boston", name: "Gillette Stadium", slug: "gillette-stadium", country: "USA", capacity: 65000, surface: "Naturrasen", lat: 42.091, lon: -71.264, tz: "America/New_York", aliases: ["foxborough", "gillette", "boston"] },
  { city: "Dallas", name: "AT&T Stadium", slug: "att-stadium", country: "USA", capacity: 80000, surface: "Naturrasen", lat: 32.747, lon: -97.093, tz: "America/Chicago", aliases: ["arlington", "at&t stadium", "dallas"] },
  { city: "Houston", name: "NRG Stadium", slug: "nrg-stadium", country: "USA", capacity: 72000, surface: "Naturrasen", lat: 29.685, lon: -95.411, tz: "America/Chicago", aliases: ["houston", "nrg"] },
  { city: "Kansas City", name: "GEHA Field at Arrowhead Stadium", slug: "arrowhead-stadium", country: "USA", capacity: 76000, surface: "Naturrasen", lat: 39.049, lon: -94.484, tz: "America/Chicago", aliases: ["kansas city", "arrowhead"] },
  { city: "Los Angeles", name: "SoFi Stadium", slug: "sofi-stadium", country: "USA", capacity: 70000, surface: "Naturrasen", lat: 33.953, lon: -118.339, tz: "America/Los_Angeles", aliases: ["inglewood", "sofi", "los angeles"] },
  { city: "Miami", name: "Hard Rock Stadium", slug: "hard-rock-stadium", country: "USA", capacity: 64000, surface: "Naturrasen", lat: 25.958, lon: -80.239, tz: "America/New_York", aliases: ["miami gardens", "hard rock", "miami"] },
  { city: "New York/New Jersey", name: "MetLife Stadium", slug: "metlife-stadium", country: "USA", capacity: 82500, surface: "Naturrasen", lat: 40.813, lon: -74.074, tz: "America/New_York", aliases: ["east rutherford", "metlife", "new york", "new jersey"] },
  { city: "Philadelphia", name: "Lincoln Financial Field", slug: "lincoln-financial-field", country: "USA", capacity: 69000, surface: "Naturrasen", lat: 39.901, lon: -75.168, tz: "America/New_York", aliases: ["philadelphia", "lincoln financial"] },
  { city: "San Francisco", name: "Levi's Stadium", slug: "levis-stadium", country: "USA", capacity: 68500, surface: "Naturrasen", lat: 37.403, lon: -121.969, tz: "America/Los_Angeles", aliases: ["santa clara", "levi", "san francisco", "bay area"] },
  { city: "Seattle", name: "Lumen Field", slug: "lumen-field", country: "USA", capacity: 69000, surface: "Kunstrasen", lat: 47.595, lon: -122.331, tz: "America/Los_Angeles", aliases: ["seattle", "lumen"] },
];

/** Text (Stadt/Stadion) -> Venue oder null. */
export function matchCity(text) {
  if (!text) return null;
  const t = String(text).toLowerCase();
  for (const v of VENUES) {
    if (v.aliases.some((a) => t.includes(a))) return v;
  }
  return null;
}

/** Venue per Slug oder null. */
export function venueBySlug(slug) {
  return VENUES.find((v) => v.slug === slug) ?? null;
}
