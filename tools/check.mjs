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
if (!Number.isInteger(META.minApp)) errs.push("META.minApp manquant (version minimale de l'appli qui sait lire ces données)");
// data.json (lu par les téléphones) doit être exactement les blocs de index.html
try { if (JSON.stringify(JSON.parse(readFileSync(new URL("../data.json", import.meta.url), "utf8"))) !== JSON.stringify(data)) errs.push("data.json ne correspond pas aux blocs de index.html → node tools/export-data.mjs"); }
catch (e) { errs.push("data.json illisible : " + e.message); }
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

// Textes sûrs : les données sont en partie écrites par le robot à partir de recherches web, et
// l'appli les affiche. Aucun « < » ni « > » (pas de balise possible), et les liens restent sur le
// site de la Mairie.
(function walk(v, path) {
  if (typeof v === "string") { if (/[<>]/.test(v)) errs.push(`${path} : « < » ou « > » interdit dans un texte (${v.slice(0, 60)})`); }
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, Array.isArray(v) ? `${path}[${k}]` : `${path}.${k}`);
})({ META, ALERT, NEWS, POOLS }, "données");
for (const p of POOLS) if (!/^https:\/\/metropole\.toulouse\.fr\//.test(p.lien || "")) errs.push(`${p.id}: lien hors du site de la Mairie (${p.lien})`);

const openSummer = POOLS.filter(p => !p.closedInSummer).length;
console.log(`• ${POOLS.length} piscines · ${openSummer} ouvertes en saison · ${NEWS.length} actus · alerte ${ALERT.active ? "ACTIVE (" + ALERT.type + ")" : "inactive"} · maj ${META.updated}`);
if (errs.length) { console.error("✗ " + errs.length + " problème(s):\n  - " + errs.join("\n  - ")); process.exit(1); }
console.log("✓ Données valides");

/* ── Affichage honnête (règle 1 de CLAUDE.md) ──────────────────────────────
   Fait tourner le MOTEUR de index.html (fonctions de calcul, sans affichage) sur les 14
   prochains jours et vérifie ce que l'appli AFFICHERA, pas seulement la forme des données :
   - « Fermée… » seulement si la fermeture est connue : une période d'horaires couvre ce jour
     (ex. dimanche hors jours d'ouverture), ou closedInSummer pendant la saison d'été ;
   - plus de 10 jours après META.updated : tout passe en « horaires non connus » (clé "unknown"). */
const eStart = html.indexOf("*/", end) + 2, eEnd = html.indexOf("EN DIRECT", eStart);
let engine;
try { engine = new Function(block + ";" + html.slice(eStart, html.lastIndexOf("/*", eEnd)) + "; return { liveState, APP };")(); }
catch (e) { console.error("✗ MOTEUR illisible :", e.message); process.exit(1); }

if (!(META.minApp <= engine.APP)) { console.error(`✗ META.minApp = ${META.minApp} mais l'appli est en version ${engine.APP} : elle ignorerait ses propres données`); process.exit(1); }
const STALE_DAYS = 10, WINDOW = 14;
const bad = [], unknown = new Set();
const today = new Date(); today.setHours(0, 0, 0, 0);
const age = d => Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(META.updated + "T00:00:00")) / 864e5); // en jours, de minuit à minuit
for (let i = 0; i < WINDOW; i++) for (const h of [12, 22]) {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i, h), ds = ymdLocal(d);
  for (const p of POOLS) {
    const ls = engine.liveState(p, d);
    if (ls.key === "unknown") { unknown.add(p.id); continue; }
    if (age(d) > STALE_DAYS) { bad.push(`${ds} ${h} h · ${p.id} : « ${ls.title} » alors que les données ont ${age(d)} jours (> ${STALE_DAYS}) — attendu « horaires non connus »`); continue; }
    if (/^Fermée/.test(ls.title)) {
      const covered = p.schedules.some(s => ds >= s.from && ds <= s.to);
      const summer = p.closedInSummer && ds >= META.seasonFrom && ds <= META.seasonTo;
      if (!covered && !summer) bad.push(`${ds} ${h} h · ${p.id} : « ${ls.title} » sans fermeture connue — attendu « horaires non connus »`);
    }
  }
}
function ymdLocal(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
if (bad.length) {
  const shown = [...new Set(bad)];
  console.error(`✗ Affichage faux : ${shown.length} cas sur les ${WINDOW} prochains jours\n  - ` + shown.slice(0, 15).join("\n  - ") + (shown.length > 15 ? `\n  … et ${shown.length - 15} autres` : ""));
  process.exit(1);
}
console.log(`✓ Affichage honnête sur ${WINDOW} jours` + (unknown.size ? ` · ${unknown.size} piscine(s) en « horaires non connus » à un moment : ${[...unknown].join(", ")}` : ""));
