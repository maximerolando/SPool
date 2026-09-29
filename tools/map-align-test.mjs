/* Vérifie la carte, dans un vrai navigateur :
   1. le fond de carte a de vraies images : on relève les tuiles réellement reçues (réponses réseau)
      une fois la couche de fond chargée, et on REFUSE si aucune n'arrive ou si elles se ressemblent
      toutes (un fournisseur peut répondre « 200 OK » avec la même image de refus partout) ;
   2. les marqueurs sont centrés sur leur position lat/lng.
   Jamais « rien à signaler » par défaut : sans tuile reçue, c'est un refus.
   Usage : node tools/map-align-test.mjs */
import { createHash } from "node:crypto";
import { launch } from "./browser.mjs";

const b = await launch();
const p = await b.newPage({ viewport: { width: 1100, height: 800 } });
const pending = [];
p.on("response", (r) => {
  if (r.request().resourceType() !== "image" || !/^https?:/.test(r.url())) return;
  pending.push(r.body().then(
    (buf) => ({ url: r.url(), status: r.status(), type: r.headers()["content-type"] || "?", size: buf.length, hash: createHash("sha256").update(buf).digest("hex").slice(0, 12) }),
    () => ({ url: r.url(), status: r.status(), type: "?", size: 0, hash: "illisible" })));
});
await p.goto(new URL("../index.html", import.meta.url).href, { waitUntil: "domcontentloaded" });
await p.click('.tab[data-view="carte"]');

// attendre la fin du chargement de la couche de fond (pas une attente fixe), 20 s au plus
const loaded = await p.waitForFunction(() => {
  let tl = null;
  if (typeof map === "undefined" || !map) return false;
  map.eachLayer((l) => { if (l instanceof L.TileLayer) tl = l; });
  return tl && !tl.isLoading() && document.querySelectorAll(".leaflet-tile").length > 0;
}, null, { timeout: 20000, polling: 200 }).then(() => true, () => false);
const tiles = await Promise.all(pending);

let ok = true;
const byHash = {};
for (const t of tiles) (byHash[t.hash] ||= []).push(t);
const distinct = Object.keys(byHash).length;
const top = Math.max(0, ...Object.values(byHash).map((l) => l.length));
const host = [...new Set(tiles.map((t) => new URL(t.url).host))].join(", ") || "—";
console.log(`Fond de carte : ${tiles.length} tuile(s) reçue(s) de ${host} · ${distinct} image(s) différente(s)` + (loaded ? "" : " · couche jamais chargée en 20 s"));
for (const [h, l] of Object.entries(byHash).sort((a, c) => c[1].length - a[1].length).slice(0, 3))
  console.log(`  ${l.length}× image ${h} (${l[0].size} octets, ${l[0].type}, HTTP ${l[0].status}) ex. ${l[0].url}`);
if (!tiles.length) { console.log("✗ Aucune tuile reçue : la carte n'a pas de fond"); ok = false; }
else if (distinct < 2 || top > tiles.length / 2) { console.log(`✗ Tuiles identiques (${top} sur ${tiles.length} sont la même image) : le fournisseur renvoie une image unique, pas une carte`); ok = false; }
else console.log("✓ Fond de carte : des images différentes, donc de vraies tuiles");

const res = await p.evaluate(() => {
  const cont = document.getElementById("leafletMap").getBoundingClientRect();
  const out = [];
  for (const [id, m] of Object.entries(mapMarkers)) {
    const cp = map.latLngToContainerPoint(m.getLatLng());
    const r = m.getElement().getBoundingClientRect();
    out.push({ id, dx: +((r.left + r.width / 2 - cont.left) - cp.x).toFixed(1), dy: +((r.top + r.height / 2 - cont.top) - cp.y).toFixed(1) });
  }
  return out;
});
const worst = Math.max(...res.map((r) => Math.max(Math.abs(r.dx), Math.abs(r.dy))));
if (worst < 2) console.log(`✓ Marqueurs alignés (${res.length}, écart max ${worst} px) — un décalage perçu vient des COORDONNÉES (données)`);
else { console.log("✗ Décalage de rendu détecté :"); for (const r of res) console.log(`  ${r.id}: dx=${r.dx} dy=${r.dy}`); ok = false; }
process.exitCode = ok ? 0 : 1;
await b.close();
