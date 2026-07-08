/* Build : injecte les ressources embarquées (police + Leaflet) dans index.html
   et produit la version "artifact" (contenu sans <!doctype>/<html>/<head>/<body>).
   Usage : node tools/build.mjs <bricolage.b64> <leaflet.css> <leaflet.js> [sortie-artifact] */
import { readFileSync, writeFileSync } from "node:fs";

const [b64Path, leafletCssPath, leafletJsPath, outArtifact] = process.argv.slice(2);
const root = new URL("..", import.meta.url).pathname;
const idxPath = root + "index.html";

let html = readFileSync(idxPath, "utf8");

function inject(placeholder, value, label) {
  if (html.includes(placeholder)) {
    html = html.split(placeholder).join(value);
    console.log(`✓ ${label} injecté (${value.length} octets)`);
  } else {
    console.log(`• ${label} : placeholder absent (déjà injecté ?)`);
  }
}

if (b64Path) inject("__FONT_DATA_URI__", readFileSync(b64Path, "utf8").trim(), "Police");
if (leafletCssPath) inject("__LEAFLET_CSS__", readFileSync(leafletCssPath, "utf8"), "Leaflet CSS");
if (leafletJsPath) inject("__LEAFLET_JS__", readFileSync(leafletJsPath, "utf8"), "Leaflet JS");

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
