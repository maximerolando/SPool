/* Publie sur GitHub Pages (git push de la branche) seulement si tout passe.
   Garantit que rien ne part de ce PC vers les téléphones sans vérification, et qu'un changement
   de code atteint vraiment les applis installées (sw.js sert index.html depuis son cache :
   sans nouveau nom de cache, les téléphones gardent l'ancienne version).
   Étapes : arbre propre → git pull --rebase → check → render → map-test → règle du cache → push.
   Usage : npm run publish            (Claude ne la lance qu'après l'accord de Maxime)
           npm run publish -- --dry-run   tout sauf le push */
import { execFileSync, spawnSync } from "node:child_process";

const BRANCH = "claude/toulouse-pools-dashboard-31xhxb";
const DRY = process.argv.includes("--dry-run");
const cwd = new URL("..", import.meta.url).pathname;
const git = (...a) => execFileSync("git", a, { cwd, encoding: "utf8" }).trim();
const stop = msg => { console.error("✗ Publication refusée : " + msg); process.exit(1); };

if (git("rev-parse", "--abbrev-ref", "HEAD") !== BRANCH) stop(`pas sur la branche ${BRANCH}`);
if (git("status", "--porcelain", "--untracked-files=no")) stop("des modifications ne sont pas commitées (on ne publie que ce qui a été vérifié)");

console.log("• Récupération des mises à jour du cloud…");
try { git("pull", "--rebase", "origin", BRANCH); } catch { stop("git pull --rebase a échoué — conflit à régler à la main"); }
const ahead = +git("rev-list", "--count", `origin/${BRANCH}..HEAD`);
if (!ahead) { console.log("✓ Rien à publier : déjà à jour avec GitHub"); process.exit(0); }

for (const [name, script] of [["données + affichage honnête", "tools/check.mjs"], ["rendu sans erreur JS", "tools/render.mjs"], ["alignement de la carte", "tools/map-align-test.mjs"]]) {
  console.log(`• Vérification : ${name}…`);
  const r = spawnSync("node", [script], { cwd, encoding: "utf8" });
  if (r.status !== 0) { process.stderr.write((r.stdout || "") + (r.stderr || "")); stop(`échec de ${script}`); }
}

// règle du cache : code de index.html modifié (hors blocs de données) ⇒ CACHE de sw.js modifié
const code = s => s.slice(0, s.indexOf("let META =")) + s.slice(s.indexOf("MOTEUR"));
const cacheName = s => (s.match(/const CACHE = "([^"]+)"/) || [])[1];
const at = (rev, f) => git("show", `${rev}:${f}`);
if (code(at(`origin/${BRANCH}`, "index.html")) !== code(at("HEAD", "index.html"))
    && cacheName(at(`origin/${BRANCH}`, "sw.js")) === cacheName(at("HEAD", "sw.js")))
  stop(`le code de index.html a changé mais pas le nom de cache de sw.js (« ${cacheName(at("HEAD", "sw.js"))} ») : les applis installées ne verraient pas la modification`);

console.log(`✓ Tout passe — ${ahead} commit(s) prêt(s)`);
if (DRY) { console.log("(--dry-run : rien n'est envoyé)"); process.exit(0); }
git("push", "origin", `HEAD:${BRANCH}`);
console.log("✓ Publié. GitHub Pages met en ligne en 1 à 2 minutes.");
