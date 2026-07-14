import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport:{width:1100,height:800} });
await p.goto("file:///home/user/SPool/index.html", { waitUntil:"domcontentloaded" });
await p.click('.tab[data-view="carte"]');
await p.waitForTimeout(1200);
const res = await p.evaluate(() => {
  const cont = document.getElementById("leafletMap").getBoundingClientRect();
  const out = [];
  for (const [id, m] of Object.entries(mapMarkers)) {
    const cp = map.latLngToContainerPoint(m.getLatLng());
    const r = m.getElement().getBoundingClientRect();
    out.push({ id, dx: +((r.left + r.width/2 - cont.left) - cp.x).toFixed(1), dy: +((r.top + r.height/2 - cont.top) - cp.y).toFixed(1) });
  }
  return out;
});
console.log("Écart centre-icône vs projection latlng (px) :");
for (const r of res) console.log(`  ${r.id}: dx=${r.dx} dy=${r.dy}`);
const worst = Math.max(...res.map(r=>Math.max(Math.abs(r.dx),Math.abs(r.dy))));
console.log(worst < 2 ? "✓ Rendu aligné — un décalage perçu vient des COORDONNÉES (données)" : "✗ Décalage de rendu détecté");
await b.close();
