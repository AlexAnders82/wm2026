// probe-sportschau.mjs — Sender-Parser direkt aus dem Rohtext testen.
const URL = "https://www.sportschau.de/fussball/fifa-wm-2026/der-spielplan-der-fussball-wm-2026,fifawm-spielplan-100.html";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const res = await fetch(URL, { headers: { "user-agent": UA, "accept-language": "de-DE,de;q=0.9", "accept": "text/html" } });
console.log("STATUS:", res.status);
const t = await res.text();
console.log("LEN:", t.length);

// Muster im Rohtext: DD.MM.HH:MM Heim - Gast {Sender}
const re = /(\d{2})\.(\d{2})\.(\d{2}):(\d{2})([A-Za-zÀ-ÿ .'’\-]{2,40}?) - ([A-Za-zÀ-ÿ .'’\-]{2,40}?)(ARD\/ZDF|ZDF\/ARD|ARD|ZDF|Magenta)/g;
let m, n = 0; const seen = [];
while ((m = re.exec(t))) {
  n++;
  if (seen.length < 50) seen.push(`${m[1]}.${m[2]} ${m[3]}:${m[4]} ${m[5].trim()} - ${m[6].trim()} => ${m[7]}`);
}
console.log("MATCHES:", n);
console.log(seen.join("\n"));
