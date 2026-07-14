/* Build : injecte les ressources embarquées (police + Leaflet) dans index.html
   et produit la version "artifact" (contenu sans <!doctype>/<html>/<head>/<body>).
   Usage : node tools/build.mjs <bricolage.b64> <leaflet.css> <leaflet.js> [sortie-artifact] */
import { readFileSync, writeFileSync } from "node:fs";

const [b64Path, leafletCssPath, leafletJsPath, outArtifact] = process.argv.slice(2);
const root = new URL("..", import.meta.url).pathname;
const idxPath = root + "index.html";

let html = readFileSync(idxPath, "utf8");

function inject(placeholder, path, label) {
  if (!html.includes(placeholder)) { console.log(`• ${label} : placeholder absent (déjà injecté)`); return; }
  let value;
  try { value = readFileSync(path, "utf8"); }
  catch (e) { console.warn(`⚠ ${label} : fichier source introuvable (${path}) — placeholder laissé tel quel`); return; }
  if (placeholder === "__FONT_DATA_URI__") value = value.trim();
  html = html.split(placeholder).join(value);
  console.log(`✓ ${label} injecté (${value.length} octets)`);
}

if (b64Path) inject("__FONT_DATA_URI__", b64Path, "Police");
if (leafletCssPath) inject("__LEAFLET_CSS__", leafletCssPath, "Leaflet CSS");
if (leafletJsPath) inject("__LEAFLET_JS__", leafletJsPath, "Leaflet JS");

writeFileSync(idxPath, html);

if (outArtifact) {
  const start = html.indexOf("<style>");
  const end = html.indexOf("</body>");
  if (start < 0 || end < 0) throw new Error("Bornes introuvables pour l'extraction artifact");
  let inner = html.slice(start, end).replace("</head>", "").replace("<body>", "");
  const artifact = `<title>Piscines de Toulouse — Écran d'info estival</title>\n` + inner.trim() + "\n";
  writeFileSync(outArtifact, artifact);
  console.log("✓ Version artifact écrite : " + outArtifact + " (" + artifact.length + " octets)");
}
