/* Build : injecte la police (data-URI) dans index.html et produit la version
   "artifact" (contenu sans <!doctype>/<html>/<head>/<body>) pour l'aperçu.
   Usage : node tools/build.mjs <chemin-vers-bricolage.b64> [sortie-artifact] */
import { readFileSync, writeFileSync } from "node:fs";

const b64Path = process.argv[2];
const outArtifact = process.argv[3] || null;
const root = new URL("..", import.meta.url).pathname;
const idxPath = root + "index.html";

let html = readFileSync(idxPath, "utf8");
const dataUri = readFileSync(b64Path, "utf8").trim();

if (html.includes("__FONT_DATA_URI__")) {
  html = html.replace("__FONT_DATA_URI__", dataUri);
  writeFileSync(idxPath, html);
  console.log("✓ Police injectée dans index.html (" + dataUri.length + " octets base64)");
} else if (html.includes("data:font/woff2;base64,")) {
  console.log("• Police déjà injectée — index.html inchangé");
} else {
  console.warn("⚠ Ni placeholder ni police trouvés dans index.html");
}

if (outArtifact) {
  const start = html.indexOf("<style>");
  const end = html.indexOf("</body>");
  if (start < 0 || end < 0) throw new Error("Bornes introuvables pour l'extraction artifact");
  let inner = html.slice(start, end);
  inner = inner.replace("</head>", "").replace("<body>", "");
  const artifact =
    `<title>Piscines de Toulouse — Écran d'info estival</title>\n` + inner.trim() + "\n";
  writeFileSync(outArtifact, artifact);
  console.log("✓ Version artifact écrite : " + outArtifact + " (" + artifact.length + " octets)");
}
