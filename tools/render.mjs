/* Génère les icônes PNG (depuis les SVG) et capture des screenshots de vérif.
   Utilise le Chromium pré-installé via playwright-core. */
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync } from "node:fs";

const EXEC = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const root = new URL("..", import.meta.url).pathname;
const SP = process.argv[2] || "/tmp";

const iconSvg = readFileSync(root + "icons/icon.svg", "utf8");
// variante maskable : fond pleine surface + glyphe dans la zone de sécurité (~66%)
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#12a7c2"/><stop offset="1" stop-color="#0a7183"/></linearGradient></defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <g transform="translate(256 256) scale(0.66) translate(-256 -256)" fill="none" stroke="#fff" stroke-width="26" stroke-linecap="round" stroke-linejoin="round">
    <path d="M92 300c30 0 30 22 60 22s30-22 60-22 30 22 60 22 30-22 60-22 30 22 60 22"/>
    <path d="M92 232c30 0 30 22 60 22s30-22 60-22 30 22 60 22 30-22 60-22 30 22 60 22"/>
    <path d="M170 232V150a34 34 0 0 1 68 0v170"/><path d="M300 232V150a34 34 0 0 1 68 0v170"/><path d="M170 180h130"/>
  </g></svg>`;

const browser = await chromium.launch({ executablePath: EXEC });

async function svgToPng(svg, size, out) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  const html = `<!doctype html><meta charset=utf8><style>*{margin:0;padding:0}html,body{width:${size}px;height:${size}px;overflow:hidden}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`;
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: size, height: size }, omitBackground: true });
  await page.close();
  console.log("✓ " + out);
}

await svgToPng(iconSvg, 512, root + "icons/icon-512.png");
await svgToPng(iconSvg, 192, root + "icons/icon-192.png");
await svgToPng(maskable, 512, root + "icons/icon-maskable-512.png");

// screenshots de vérification (clair desktop, sombre desktop, mobile)
async function shot(theme, w, h, out, full) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: theme });
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await page.goto("file://" + root + "index.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await page.screenshot({ path: out, fullPage: !!full });
  await page.close();
  console.log("✓ " + out + (errs.length ? "  ⚠ ERREURS: " + errs.slice(0, 6).join(" | ") : "  (aucune erreur JS)"));
  return errs;
}

const e1 = await shot("light", 1280, 900, SP + "/shot-live-light.png");
const e2 = await shot("dark", 1280, 900, SP + "/shot-live-dark.png");
const e3 = await shot("light", 390, 844, SP + "/shot-mobile.png");

// vues supplémentaires : cliquer les onglets
async function shotView(view, out) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 950 }, colorScheme: "light" });
  const errs = []; page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto("file://" + root + "index.html", { waitUntil: "networkidle" });
  await page.click(`.tab[data-view="${view}"]`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: out });
  await page.close();
  console.log("✓ " + out + (errs.length ? "  ⚠ " + errs.join(" | ") : ""));
}
await shotView("carte", SP + "/shot-carte.png");
await shotView("calendrier", SP + "/shot-calendrier.png");
await shotView("annuaire", SP + "/shot-annuaire.png");

await browser.close();
const allErrs = [...e1, ...e2, ...e3];
console.log(allErrs.length ? "\n⚠ Erreurs JS détectées" : "\n✅ Rendu OK, aucune erreur JS bloquante");
