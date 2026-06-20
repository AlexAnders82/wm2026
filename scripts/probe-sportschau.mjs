// probe-sportschau.mjs — einmaliger Test, ob die Sportschau-Spielplanseite vom
// CI-Runner aus lesbar ist (anderes Netz, Browser-User-Agent). Nur Diagnose.
const URL = "https://www.sportschau.de/fussball/fifa-wm-2026/der-spielplan-der-fussball-wm-2026,fifawm-spielplan-100.html";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

try {
  const res = await fetch(URL, { headers: { "user-agent": UA, "accept-language": "de-DE,de;q=0.9", "accept": "text/html" } });
  console.log("STATUS:", res.status);
  const t = await res.text();
  console.log("LENGTH:", t.length);
  for (const k of ["MagentaTV", "ZDF", "ARD", "__NEXT_DATA__", "__APOLLO", "application/json", "broadcast", "sender", "Spielplan"]) {
    console.log(`HAS ${k}:`, t.includes(k));
  }
  const i = t.indexOf("ZDF");
  if (i >= 0) console.log("SNIPPET:", JSON.stringify(t.slice(i - 80, i + 160)));
} catch (e) {
  console.log("ERROR:", e.message);
}
