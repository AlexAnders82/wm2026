// probe-sportschau.mjs — testet das Parsen der Sender aus dem Sportschau-Spielplan.
const URL = "https://www.sportschau.de/fussball/fifa-wm-2026/der-spielplan-der-fussball-wm-2026,fifawm-spielplan-100.html";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const res = await fetch(URL, { headers: { "user-agent": UA, "accept-language": "de-DE,de;q=0.9", "accept": "text/html" } });
console.log("STATUS:", res.status);
let t = await res.text();
// Sichtbaren Text extrahieren (Tags entfernen).
t = t.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, "");
t = t.replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#x27;|&#39;/g, "'");
console.log("TEXTLEN:", t.length);

// Muster: DD.MM.HH:MM Heim - Gast {Sender|Score}
const re = /(\d{2})\.(\d{2})\.(\d{2}):(\d{2})([A-Za-zÀ-ÿ .'’\-]+?) - ([A-Za-zÀ-ÿ .'’\-]+?)(ARD\/ZDF|ZDF\/ARD|ARD|ZDF|Magenta)/g;
let m, n = 0;
const seen = [];
while ((m = re.exec(t)) && n < 200) {
  n++;
  if (seen.length < 45) seen.push(`${m[1]}.${m[2]} ${m[5].trim()} - ${m[6].trim()} => ${m[7]}`);
}
console.log("MATCHES:", n);
console.log(seen.join("\n"));
