/* Exporte les blocs de données de index.html vers data.json.
   L'app installée (PWA / mobile) recharge ce fichier au lancement, toutes les
   15 min et via le bouton ↻ — c'est ainsi que les mises à jour de données
   atteignent les apps sans redéploiement.
   Usage : node tools/export-data.mjs  (à lancer après toute édition des données). */
import { readFileSync, writeFileSync } from "node:fs";

const root = new URL("..", import.meta.url).pathname;
const html = readFileSync(root + "index.html", "utf8");
const start = html.indexOf("let META =");
const end = html.indexOf("MOTEUR");
if (start < 0 || end < 0) { console.error("✗ Blocs de données introuvables"); process.exit(1); }
let block = html.slice(start, end);
block = block.slice(0, block.lastIndexOf("];") + 2);

const data = new Function(block + "; return { META, ALERT, NEWS, POOLS };")();
writeFileSync(root + "data.json", JSON.stringify(data, null, 1) + "\n");
console.log(`✓ data.json généré — ${data.POOLS.length} piscines, maj ${data.META.updated}`);
