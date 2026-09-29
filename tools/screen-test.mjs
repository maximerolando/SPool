/* Vérifie ce que voit la personne, dans un vrai navigateur, à 390 px de large (iPhone courant) :
   1. aucune phrase visible ne dit plus que ce que l'appli sait, à 3 moments (en saison ;
      lendemain de la mise à jour, sans horaire connu ; données périmées) ;
   2. mise en page : les 4 onglets entrent dans l'écran, aucun état de piscine n'est coupé ;
   3. le curseur clavier reste en place quand l'écran se recalcule (toutes les 30 s) ;
   4. un texte piégé dans les données s'affiche comme du texte et ne s'exécute pas ;
   5. une appli trop ancienne pour les données reçues (META.minApp) passe tout en « horaires non connus ».
   Usage : node tools/screen-test.mjs   → sortie 1 au premier problème relevé */
import { launch } from "./browser.mjs";

const APP = new URL("../index.html", import.meta.url).href;
const b = await launch();
const bad = [];
const page = async (time) => {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.injected = [];
  p.on("console", (m) => { if (m.text().includes("SPOOL-PIEGE")) p.injected.push(m.text()); });
  if (time) await p.clock.install({ time });
  await p.goto(APP, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(300);
  return p;
};
const updated = await (async () => { const p = await page(); const u = await p.evaluate(() => META.updated); await p.close(); return u; })();
const at = (days, hm) => { const d = new Date(updated + "T" + hm); d.setDate(d.getDate() + days); return d; };

// 1. Phrases — lues dans la barre du haut, les vues et une fiche ; le fil d'actus (daté) n'est pas lu
const MOMENTS = { "en saison (15/07, 15 h 25)": new Date("2026-07-15T15:25:00"), "lendemain de la mise à jour, 16 h 25": at(1, "16:25:00"), "données périmées (+12 jours)": at(12, "16:25:00") };
for (const [nom, time] of Object.entries(MOMENTS)) {
  const p = await page(time);
  const etat = await p.evaluate(() => { const n = new Date(), ds = ymd(n); return { alerte: alertActiveOn(ds), ete: ds >= META.seasonFrom && ds <= META.seasonTo, inconnues: POOLS.filter((x) => statusOn(x, n).state === "inconnu").length }; });
  // seulement le texte VISIBLE (innerText dans la page, le fil d'actus caché le temps de la lecture)
  const lire = () => p.evaluate(() => { const n = document.querySelector("#newsList"), d = n.style.display; n.style.display = "none"; const t = document.title + "\n" + document.querySelector(".topbar").innerText + "\n" + document.querySelector("main").innerText; n.style.display = d; return t; });
  const txt = [await lire()];
  await p.click('.tab[data-view="annuaire"]'); await p.click('#fStatut .chip[data-f="ouverte"]'); await p.waitForTimeout(150); txt.push(await lire());
  await p.click('.tab[data-view="infos"]'); await p.waitForTimeout(150); txt.push(await lire());
  await p.click('.tab[data-view="annuaire"]'); await p.click('#fStatut .chip[data-f="all"]'); await p.click('.pcard[data-id="papus"]'); await p.waitForTimeout(350);
  txt.push(await p.evaluate(() => document.querySelector("#drawer").innerText));
  // toutes les astuces possibles à ce moment, pas seulement celle qui tourne à l'écran (h:25 = astuce n° 3)
  txt.push(await p.evaluate(() => (typeof tipsFor === "function" ? tipsFor(new Date()) : []).join("\n")));
  const all = txt.join("\n");
  const regle = (cond, re, msg) => { const m = cond && all.match(re); if (m) bad.push(`phrase · ${nom} : ${msg} — « ${m[0].trim()} »`); };
  regle(!etat.alerte, /canicule\s*:\s*1\s*€[^\n]*/i, "mesure canicule affichée sans alerte active");
  regle(!etat.ete, /(saison estivale|[ÉE]t[ée] \d{4}|estival\b)/i, "« été » affiché hors saison");
  regle(!etat.ete, /Horaires de la saison/i, "« horaires de la saison » affichés hors saison");
  regle(!etat.alerte, /(21 h[^\n]{0,60}canicule|canicule[^\n]{0,60}21 h)/i, "horaires de canicule affichés sans alerte active");
  regle(etat.inconnues > 0, /Aucune piscine ne correspond/, "« aucune » alors que des horaires sont inconnus");
  regle(etat.inconnues > 0, /(^|\n)\s*0\s*\n?\s*ouvertes? maintenant/i, "« 0 ouverte » alors que des horaires sont inconnus");
  regle(true, /All[ôo] Toulouse 31 01/, "numéro sans source officielle");
  await p.close();
}

// 2. Mise en page à 390 px
{
  const p = await page(at(1, "12:00:00"));
  const r = await p.evaluate(() => ({
    tabs: [...document.querySelectorAll(".tab")].filter((t) => { const x = t.getBoundingClientRect(); return x.left < 0 || x.right > innerWidth; }).map((t) => t.innerText.trim()),
    cut: [...document.querySelectorAll(".bstate,.bname")].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.innerText.trim()),
    overflow: document.documentElement.scrollWidth > innerWidth,
  }));
  if (r.tabs.length) bad.push(`390 px : ${r.tabs.length} onglet(s) sur 4 hors de l'écran (${r.tabs.join(", ")})`);
  if (r.cut.length) bad.push(`390 px : ${r.cut.length} texte(s) coupé(s) dans le tableau, ex. « ${r.cut[0]} »`);
  if (r.overflow) bad.push("390 px : la page déborde en largeur");

  // 3. Curseur clavier après le recalcul de l'écran
  await p.focus('.brow[data-id="papus"]');
  await p.evaluate(() => renderLive());
  const still = await p.evaluate(() => document.activeElement?.dataset?.id || document.activeElement?.tagName);
  if (still !== "papus") bad.push(`curseur : après le recalcul, le focus quitte la ligne Papus (→ ${still})`);

  // 4. Données piégées reçues par la porte d'entrée des données distantes (celle de data.json)
  await p.evaluate(() => {
    const t = `<img src=x onerror="console.log('SPOOL-PIEGE')">`;
    const d = JSON.parse(JSON.stringify({ META, ALERT, NEWS, POOLS }));
    d.NEWS.unshift({ date: META.updated, type: "info", pool: null, title: "Piège" + t, body: t });
    d.POOLS[0].nom += t; d.POOLS[0].note += t; d.POOLS[0].lien = "javascript:console.log('SPOOL-PIEGE')";
    if (typeof acceptData === "function") acceptData(d); else { ({ META, ALERT, NEWS, POOLS } = d); } // ancienne appli : affectation directe, comme son loadRemoteData
    renderLive(); renderInfos(); renderAnnuaire(); openDrawer(POOLS[0].id);
  });
  await p.click('.tab[data-view="infos"]').catch(() => {});
  await p.waitForTimeout(400);
  const href = await p.evaluate(() => [...document.querySelectorAll("a[href^='javascript']")].length);
  if (p.injected.length || href) bad.push(`injection : un texte piégé s'exécute ou devient un lien actif (${p.injected.length} exécution(s), ${href} lien(s) javascript:)`);
  await p.close();
}

// 5. Appli trop ancienne pour les données reçues (META.minApp > APP) : tout en « non connus », et le dire
{
  const p = await page(new Date("2026-07-15T15:25:00")); // en saison : sans la règle, des piscines seraient « Ouverte »
  const r = await p.evaluate(() => {
    if (typeof acceptData !== "function") return { skip: true };
    acceptData({ ...JSON.parse(JSON.stringify({ META, ALERT, NEWS, POOLS })), META: { ...META, minApp: APP + 1 } }); renderLive();
    return { known: POOLS.filter((x) => statusOn(x, new Date()).state !== "inconnu").length, said: /trop ancienne/.test(document.body.innerText) };
  });
  if (r.skip) bad.push("appli trop ancienne : aucune porte d'entrée des données (acceptData) à vérifier");
  else if (r.known || !r.said) bad.push(`appli trop ancienne : ${r.known} piscine(s) encore affichée(s) avec un état connu${r.said ? "" : ", et rien ne le dit à l'écran"}`);
  await p.close();
}
await b.close();
if (bad.length) { console.log(`✗ ${bad.length} problème(s) à l'écran :\n  - ` + bad.join("\n  - ")); process.exit(1); }
console.log("✓ Écran : phrases justes (3 moments), mise en page 390 px, curseur stable, textes piégés neutralisés, appli trop ancienne → « non connus »");
