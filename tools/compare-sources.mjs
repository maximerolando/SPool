/* Compare les fiches officielles de la Mairie à la dernière version validée (sources/mairie/).
   Garantit qu'un changement de fiche, un lien mort ou une piscine absente de SPool ne passe pas
   inaperçu. Ne modifie jamais les données de l'appli : c'est Claude (avec Maxime) qui lit l'écart
   et corrige index.html, puis valide la nouvelle version avec --accept.
   Usage : node tools/compare-sources.mjs            → sortie 1 s'il y a du nouveau depuis la dernière validation
           node tools/compare-sources.mjs --accept   → enregistre l'état actuel comme validé
   À lancer depuis ce PC (le cloud Claude n'atteint pas metropole.toulouse.fr). Node seul. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { collect } from "./sources/mairie.mjs";

const root = new URL("..", import.meta.url);
const dir = new URL("sources/mairie/", root);
const ACCEPT = process.argv.includes("--accept");
const { POOLS } = JSON.parse(readFileSync(new URL("data.json", root), "utf8"));

const { officialList, items } = await collect(POOLS);
if (!officialList && items.every(i => i.status === 0)) { console.error("✗ Site de la Mairie injoignable depuis cette machine — rien comparé."); process.exit(2); }

// état courant, sous la forme exacte des fichiers enregistrés
const snap = i => i.status === 200 ? i.text : `HTTP ${i.status}${i.error ? " " + i.error : ""}\n`;
const linked = new Set(items.map(i => i.finalUrl));
const missing = (officialList || []).filter(u => !linked.has(u));
const listing = (officialList || []).join("\n") + "\n";

const read = name => { const f = new URL(name, dir); return existsSync(f) ? readFileSync(f, "utf8") : null; };
const changes = [];
for (const i of items) {
  const before = read(i.id + ".txt"), now = snap(i);
  if (before === now) continue;
  if (before == null) { changes.push(`${i.id} : jamais validée (${i.status === 200 ? "fiche lue" : "HTTP " + i.status})`); continue; }
  const b = new Set(before.split("\n")), n = new Set(now.split("\n"));
  const del = [...b].filter(l => l && !n.has(l)), add = [...n].filter(l => l && !b.has(l));
  changes.push(`${i.id} : la fiche a changé (${i.finalUrl})\n` + [...del.map(l => "      − " + l), ...add.map(l => "      + " + l)].join("\n"));
}
if (officialList && read("_liste.txt") !== listing) changes.push("liste officielle des piscines : elle a changé depuis la dernière validation");

// toujours rappelé, même déjà validé : ce que SPool ne couvre pas bien
const known = [
  ...items.filter(i => i.status !== 200).map(i => `${i.id} : lien officiel mort (HTTP ${i.status}) — ${i.url}`),
  ...items.filter(i => i.status === 200 && i.finalUrl !== i.url).map(i => `${i.id} : lien redirigé → ${i.finalUrl}`),
  ...missing.map(u => `absente de SPool : ${u}`),
];

console.log(`• Mairie : ${items.filter(i => i.status === 200).length}/${items.length} fiches lues · liste officielle : ${officialList ? officialList.length + " piscines" : "illisible"}`);
if (known.length) console.log("⚠ À savoir :\n  - " + known.join("\n  - "));
if (ACCEPT) {
  mkdirSync(dir, { recursive: true });
  for (const i of items) if (i.status !== 0) writeFileSync(new URL(i.id + ".txt", dir), snap(i));
  if (officialList) writeFileSync(new URL("_liste.txt", dir), listing);
  console.log(`✓ État actuel enregistré comme validé (sources/mairie/, ${new Date().toISOString().slice(0, 10)})`);
} else if (changes.length) {
  console.log(`✗ ${changes.length} nouveauté(s) depuis la dernière validation :\n  - ` + changes.join("\n  - "));
  console.log("→ Corriger les données de index.html si besoin, puis : node tools/compare-sources.mjs --accept");
  process.exitCode = 1;
} else console.log("✓ Rien de nouveau depuis la dernière validation");
