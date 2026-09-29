/* Vérifie le cache du téléphone (sw.js), dans un vrai navigateur, avec le site servi en HTTP comme
   GitHub Pages (« max-age=600 » : le navigateur garde lui-même chaque fichier 10 minutes).
   1. Après une visite, la carte ouverte et 5 actualisations : rien d'un autre site en cache
      (sinon une image de refus du fournisseur de carte reste figée), une seule copie de data.json.
   2. Mise à jour : une appli installée affiche la nouvelle version en 2 ouvertures au plus.
   3. Hors ligne : l'appli s'ouvre ; une image absente ne reçoit pas la page à sa place.
   Usage : node tools/sw-test.mjs   → sortie 1 au premier problème */
import { createServer } from "node:http";
import { readFile, writeFile, mkdtemp, cp, rm } from "node:fs/promises";
import { extname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { launch } from "./browser.mjs";

const repo = fileURLToPath(new URL("..", import.meta.url));
const site = await mkdtemp(join(tmpdir(), "spool-sw-"));
for (const f of ["index.html", "sw.js", "data.json", "manifest.webmanifest", "icons"]) await cp(join(repo, f), join(site, f), { recursive: true });
const TYPES = { ".html": "text/html; charset=utf-8", ".json": "application/json", ".js": "text/javascript", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml" };
const srv = createServer(async (q, r) => {
  const f = join(site, decodeURIComponent(new URL(q.url, "http://x").pathname).replace(/\/$/, "/index.html"));
  try { const body = await readFile(f); r.writeHead(200, { "content-type": TYPES[extname(f)] || "application/octet-stream", "cache-control": "max-age=600" }); r.end(body); }
  catch { r.writeHead(404); r.end(); }
});
await new Promise((ok) => srv.listen(0, "127.0.0.1", ok));
const URL_ = `http://127.0.0.1:${srv.address().port}/`;
const b = await launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();
const bad = [];
// goto, pas reload : un rechargement forcé contourne le service worker. Puis on laisse une mise à jour
// éventuelle finir de s'installer (sur un téléphone, deux ouvertures sont espacées de bien plus que ça).
// (boucle manuelle : waitForFunction n'attend pas une fonction asynchrone, elle la croit vraie tout de suite)
const settled = async () => { for (let i = 0; i < 75; i++) { if (await p.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return !r || (!r.installing && !r.waiting); })) return; await p.waitForTimeout(200); } };
// La vérification de mise à jour, le navigateur la fait quand il veut ; l'appli la demande à chaque
// ouverture (update()), et le test la demande aussi, pour mesurer ce qui compte : la page servie ensuite.
const open = async () => { await p.goto(URL_); await p.evaluate(async () => { try { await (await navigator.serviceWorker.getRegistration())?.update(); } catch {} }); await settled(); };

// installation : 1re visite, puis une ouverture contrôlée par le service worker
await p.goto(URL_);
await p.evaluate(() => navigator.serviceWorker.ready.then(() => true)); // attend un service worker ACTIF (pas « installé »)
await open();
if (!(await p.evaluate(() => !!navigator.serviceWorker.controller))) bad.push("le service worker ne contrôle pas la page après installation");

// 1. contenu du cache
await p.click('.tab[data-view="carte"]');
await p.waitForFunction(() => { let t; if (typeof map === "undefined" || !map) return false; map.eachLayer((l) => { if (l instanceof L.TileLayer) t = l; }); return t && !t.isLoading(); }, null, { timeout: 20000 }).catch(() => {});
for (let i = 0; i < 5; i++) { await p.click("#refreshBtn"); await p.waitForTimeout(400); }
await p.waitForTimeout(600);
const entries = await p.evaluate(async () => { const o = []; for (const k of await caches.keys()) for (const q of await (await caches.open(k)).keys()) o.push(q.url); return o; });
const other = entries.filter((u) => !u.startsWith(URL_));
const copies = entries.filter((u) => /data\.json/.test(u));
if (other.length) bad.push(`cache : ${other.length} entrée(s) d'un autre site, ex. ${other[0]}`);
if (copies.length !== 1) bad.push(`cache : ${copies.length} copies de data.json (attendu : 1)`);

// 2. mise à jour : nouvelle page + nouveau nom de cache sur le serveur ; l'ancienne page reste dans le cache du navigateur
await writeFile(join(site, "index.html"), (await readFile(join(site, "index.html"), "utf8")).replace("<title>", "<title>[NOUVELLE VERSION] "));
await writeFile(join(site, "sw.js"), (await readFile(join(site, "sw.js"), "utf8")).replace(/const CACHE = "([^"]+)"/, 'const CACHE = "$1-essai"'));
const seen = [];
for (let i = 1; i <= 3; i++) { await open(); seen.push((await p.title()).startsWith("[NOUVELLE VERSION]")); }
const firstNew = seen.indexOf(true) + 1;
if (!firstNew || firstNew > 2) bad.push(`mise à jour : nouvelle version ${firstNew ? "vue seulement à la " + firstNew + "e ouverture" : "jamais vue en 3 ouvertures"} (attendu : 2 au plus)`);

// 3. hors ligne
await ctx.setOffline(true);
await open().catch(() => {});
if (!(await p.title().catch(() => ""))) bad.push("hors ligne : l'appli ne s'ouvre pas");
const img = await p.evaluate(async () => { try { const r = await fetch("icons/absente.png"); return r.headers.get("content-type") || "?"; } catch { return "erreur réseau"; } });
if (/text\/html/.test(img)) bad.push("hors ligne : une image absente reçoit la page index.html à sa place");
await ctx.setOffline(false);

await b.close(); srv.close(); await rm(site, { recursive: true, force: true });
console.log(`• cache : ${entries.length} entrées, ${other.length} d'un autre site, ${copies.length} copie(s) de data.json · mise à jour vue à l'ouverture n° ${firstNew || "—"}`);
if (bad.length) { console.log(`✗ ${bad.length} problème(s) de cache :\n  - ` + bad.join("\n  - ")); process.exit(1); }
console.log("✓ Cache du téléphone : rien d'un autre site, une copie de data.json, mise à jour en 2 ouvertures, hors ligne OK");
