// venues.mjs — die 16 WM-2026-Austragungsorte mit Koordinaten + Zeitzone.
// Für Wetter (Open-Meteo) und Ortszeit auf der Spielseite.

export const VENUES = [
  { city: "Mexiko-Stadt", lat: 19.303, lon: -99.150, tz: "America/Mexico_City", aliases: ["mexico city", "ciudad de mexico", "azteca", "mexiko"] },
  { city: "Guadalajara", lat: 20.681, lon: -103.463, tz: "America/Mexico_City", aliases: ["guadalajara", "zapopan", "akron"] },
  { city: "Monterrey", lat: 25.669, lon: -100.244, tz: "America/Monterrey", aliases: ["monterrey", "guadalupe", "bbva"] },
  { city: "Toronto", lat: 43.633, lon: -79.418, tz: "America/Toronto", aliases: ["toronto", "bmo"] },
  { city: "Vancouver", lat: 49.277, lon: -123.112, tz: "America/Vancouver", aliases: ["vancouver", "bc place"] },
  { city: "Atlanta", lat: 33.755, lon: -84.401, tz: "America/New_York", aliases: ["atlanta", "mercedes-benz"] },
  { city: "Boston", lat: 42.091, lon: -71.264, tz: "America/New_York", aliases: ["foxborough", "gillette", "boston"] },
  { city: "Dallas", lat: 32.747, lon: -97.093, tz: "America/Chicago", aliases: ["arlington", "at&t stadium", "dallas"] },
  { city: "Houston", lat: 29.685, lon: -95.411, tz: "America/Chicago", aliases: ["houston", "nrg"] },
  { city: "Kansas City", lat: 39.049, lon: -94.484, tz: "America/Chicago", aliases: ["kansas city", "arrowhead"] },
  { city: "Los Angeles", lat: 33.953, lon: -118.339, tz: "America/Los_Angeles", aliases: ["inglewood", "sofi", "los angeles"] },
  { city: "Miami", lat: 25.958, lon: -80.239, tz: "America/New_York", aliases: ["miami gardens", "hard rock", "miami"] },
  { city: "New York/New Jersey", lat: 40.813, lon: -74.074, tz: "America/New_York", aliases: ["east rutherford", "metlife", "new york", "new jersey"] },
  { city: "Philadelphia", lat: 39.901, lon: -75.168, tz: "America/New_York", aliases: ["philadelphia", "lincoln financial"] },
  { city: "San Francisco", lat: 37.403, lon: -121.969, tz: "America/Los_Angeles", aliases: ["santa clara", "levi", "san francisco", "bay area"] },
  { city: "Seattle", lat: 47.595, lon: -122.331, tz: "America/Los_Angeles", aliases: ["seattle", "lumen"] },
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
