/* Vérifie l'intégrité des blocs de données de index.html sans navigateur.
   Extrait META / ALERT / NEWS / POOLS, les évalue, et contrôle quelques invariants.
   Sert de garde-fou rapide (notamment pour la routine d'actualisation).
   Usage : node tools/check.mjs   → sortie non-zéro si problème. */
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const start = html.indexOf("let META =");
const end = html.indexOf("MOTEUR");
if (start < 0 || end < 0) { console.error("✗ Blocs de données introuvables"); process.exit(1); }
let block = html.slice(start, end);
block = block.slice(0, block.lastIndexOf("];") + 2); // jusqu'à la fin du tableau POOLS

let data;
try { data = new Function(block + "; return { META, ALERT, NEWS, POOLS };")(); }
catch (e) { console.error("✗ Erreur de syntaxe dans les données :", e.message); process.exit(1); }

const { META, ALERT, NEWS, POOLS } = data;
const errs = [];
const isYmd = s => /^\d{4}-\d{2}-\d{2}$/.test(s);

if (!isYmd(META.updated)) errs.push("META.updated n'est pas au format AAAA-MM-JJ");
if (!isYmd(META.seasonFrom) || !isYmd(META.seasonTo)) errs.push("META.season(From|To) invalide");
if (ALERT.active && !isYmd(ALERT.from)) errs.push("ALERT.from invalide alors que active=true");
if (!Array.isArray(POOLS) || POOLS.length < 5) errs.push("POOLS trop court");

const ids = new Set();
for (const p of POOLS) {
  if (!p.id) errs.push("piscine sans id");
  if (ids.has(p.id)) errs.push("id dupliqué : " + p.id);
  ids.add(p.id);
  if (!Array.isArray(p.coords) || p.coords.length !== 2) errs.push(`${p.id}: coords invalides`);
  else { const [la, lo] = p.coords; if (la < 43.4 || la > 43.75 || lo < 1.2 || lo > 1.6) errs.push(`${p.id}: coords hors de Toulouse`); }
  if (!Array.isArray(p.schedules)) errs.push(`${p.id}: schedules manquant`);
  for (const s of (p.schedules || [])) {
    if (!isYmd(s.from) || !isYmd(s.to)) errs.push(`${p.id}: période mal datée`);
    if (s.from > s.to) errs.push(`${p.id}: from > to`);
    if (typeof s.open !== "number" || typeof s.close !== "number" || s.open >= s.close) errs.push(`${p.id}: heures invalides`);
    if (!["all", "weekdays", "weekends"].includes(s.days) && !Array.isArray(s.days)) errs.push(`${p.id}: days invalide`);
  }
  if (p.closedInSummer && p.schedules.length) errs.push(`${p.id}: closedInSummer mais a des schedules`);
}
for (const id of Object.keys(ALERT.overrides || {})) if (!ids.has(id)) errs.push(`ALERT.overrides vise un id inconnu : ${id}`);
for (const n of NEWS) { if (!isYmd(n.date)) errs.push(`NEWS: date invalide (${n.title})`); if (n.pool && !ids.has(n.pool)) errs.push(`NEWS: pool inconnu (${n.pool})`); }

const openSummer = POOLS.filter(p => !p.closedInSummer).length;
console.log(`• ${POOLS.length} piscines · ${openSummer} ouvertes en saison · ${NEWS.length} actus · alerte ${ALERT.active ? "ACTIVE (" + ALERT.type + ")" : "inactive"} · maj ${META.updated}`);
if (errs.length) { console.error("✗ " + errs.length + " problème(s):\n  - " + errs.join("\n  - ")); process.exit(1); }
console.log("✓ Données valides");
