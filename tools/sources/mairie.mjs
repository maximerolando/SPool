/* Source « Mairie » : collecte seule, aucune comparaison ni écriture.
   Télécharge la fiche officielle de chaque piscine (champ `lien` de POOLS) et en extrait le texte
   du contenu principal (horaires, fermetures, bassins), sans menus ni pied de page.
   Contrat commun à toutes les sources de tools/sources/ :
     collect(pools) → { source, officialList: [url…] | null, items: [{ id, url, finalUrl, status, text }] }
   Node seul (fetch intégré), sans dépendance. Ne marche que depuis une machine qui atteint
   metropole.toulouse.fr (ce PC oui, le cloud Claude non). */

export const LIST_URL = "https://metropole.toulouse.fr/sortir/sport/les-piscines-toulousaines";
const UA = { "user-agent": "Mozilla/5.0 (SPool, application independante ; verification des horaires)" }; // en-tête HTTP : ASCII seulement

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", laquo: "«", raquo: "»", eacute: "é", egrave: "è", agrave: "à", ccedil: "ç", ndash: "–", mdash: "—", hellip: "…" };
const decode = s => s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) =>
  e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : +e.slice(1)) : (ENT[e.toLowerCase()] ?? m));

/* Contenu principal d'une fiche : après le « Sommaire », avant « Infos pratiques » / le pied de page. */
export function extractText(html) {
  let main = html;
  const a = html.indexOf('class="block__summary"');
  if (a >= 0) main = main.slice(main.indexOf("</nav>", a) + 6);
  else if (html.includes('class="page-title"')) main = main.slice(main.indexOf(">", main.indexOf('class="page-title"')) + 1); // fiche sans sommaire (La Ramée)
  const b = main.search(/<h2[^>]*>\s*Infos pratiques|<footer/);
  if (b >= 0) main = main.slice(0, b);
  return decode(main.replace(/<(script|style|svg)[\s\S]*?<\/\1>/gi, "").replace(/<[^>]+>/g, "\n"))
    .split("\n").map(l => l.replace(/\s+/g, " ").trim()).filter(Boolean)
    .filter((l, i, arr) => l !== arr[i - 1]) // doublons consécutifs (titres d'accordéon répétés)
    .join("\n")
    // ni les liens communs du haut, ni les blocs communs à toutes les fiches (règlement, tarifs) :
    // un changement là-dedans ferait « changer » les 12 fiches à la fois
    .replace(/^[\s\S]*?\nConsulter la programmation des activités sportives municipales\n/, "")
    .replace(/\n(Règlement intérieur des piscines|Billetterie et tarifs)[\s\S]*$/, "") + "\n";
}

async function get(url) {
  try {
    const r = await fetch(url, { headers: UA, redirect: "follow" });
    return { status: r.status, finalUrl: r.url, html: r.ok ? await r.text() : "" };
  } catch (e) { return { status: 0, finalUrl: url, html: "", error: e.message }; }
}

export async function collect(pools) {
  const list = await get(LIST_URL);
  const officialList = list.html
    ? [...new Set([...list.html.matchAll(/href="(\/annuaire\/piscine[^"#?]*)"/g)].map(m => new URL(m[1], LIST_URL).href))]
    : null;
  const items = await Promise.all(pools.map(async p => {
    const r = await get(p.lien);
    return { id: p.id, url: p.lien, finalUrl: r.finalUrl, status: r.status, text: r.html ? extractText(r.html) : "", error: r.error };
  }));
  return { source: "mairie", officialList, items };
}
