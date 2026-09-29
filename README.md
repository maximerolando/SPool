# 🏊 Piscines de Toulouse — appli indépendante

Une petite appli, installable sur téléphone, pour savoir d'un coup d'œil quelles
**piscines municipales de Toulouse** sont ouvertes, d'après les **fiches officielles de la
Mairie**. Quand elle ne connaît pas l'horaire du jour, elle l'écrit (« horaires non
connus », avec le lien officiel) au lieu de deviner.

En ligne : https://maximerolando.github.io/SPool/

Tout tient dans **un seul `index.html` autonome** : police, données, logique et la
bibliothèque de carte sont embarquées. Aucune dépendance, aucun serveur requis.
Seules les **tuiles de la carte** se chargent en ligne (voir plus bas).

> **Comment ce projet est construit** : tenu par des agents Claude (une tâche planifiée
> dans le cloud et des sessions locales), avec le plus petit setup qui garantit que
> l'appli **n'affiche jamais un état faux**. Ce qui est vérifié, pourquoi, et ce qui n'est
> volontairement pas installé : [`docs/CONSTRUCTION.md`](docs/CONSTRUCTION.md) ·
> feuille de route et idées non retenues : [`docs/IDEES.md`](docs/IDEES.md) ·
> chrono et prises des vérifications : [`docs/MESURES.md`](docs/MESURES.md).
>
> Application indépendante, non affiliée à la Mairie de Toulouse. Source : les fiches
> officielles des piscines sur metropole.toulouse.fr.

---

## ✨ Les vues

| Vue | Contenu |
|-----|---------|
| **En direct** | Horloge, nombre de piscines **ouvertes à l'instant** (« ? » quand on ne sait pas), bandeau d'**alerte** quand une alerte est active (canicule…), et surtout le **Tableau des horaires** : toutes les amplitudes d'ouverture **alignées** sur un même axe, avec une **ligne « maintenant »** qui traverse tout — on voit d'un coup qui est ouvert, qui ouvre plus tard, qui a déjà fermé. |
| **Carte** | **Plan IGN** (Géoplateforme de l'IGN, via Leaflet) avec un marqueur par piscine **coloré selon l'état en direct**. Clic → fiche + bouton **Itinéraire** qui ouvre l'app de navigation. |
| **Les piscines** | Annuaire filtrable (statut, type, 50 m, recherche) avec **fiche détaillée** par piscine. |
| **Infos & actus** | Fil d'actualités, règles (bonnet, tenue, tarif canicule), sources. |

**États de couleur** (dans le tableau, la carte et les fiches) :
🟢 ouverte maintenant · 🔵 ouvre plus tard aujourd'hui · 🟠 déjà fermée aujourd'hui ·
🟣 à venir (ouvre un autre jour) · 🔴 fermée (fermeture connue et sourcée) ·
⚪ horaires non connus.

Bonus : **thème clair/sombre**, **mode kiosque** plein écran (les vues défilent seules),
**PWA installable** sur téléphone, statut **recalculé toutes les 30 s**.

---

## 🧠 Données : recopiées des fiches officielles, jamais devinées

Les **horaires** sont recopiés des fiches officielles de la Mairie ; le statut ouvert/fermé
se **recalcule** selon la date et l'heure. Les fiches se relisent depuis un PC qui atteint
le site de la Mairie (`npm run compare` : signale tout changement depuis la dernière
vérification). Sans horaire connu pour un jour, ou plus de 10 jours sans mise à jour des
données, l'appli affiche « horaires non connus ».

### Où éditer (en tête du `<script>` dans `index.html`)

1. **`META.updated`** — la date de votre passage.
2. **`ALERT`** — l'alerte en cours (ex. canicule) : dates, tarif, et `overrides` d'horaires
   par piscine (fermeture prolongée, créneau week-end). Mettez `active:false` pour la lever.
   ```js
   overrides:{ "papus":{close:21}, "yvonne-godard":{close:21, weekend:{open:12,close:21}} }
   ```
3. **`NEWS[]`** — les actualités (`type: ouverture | fermeture | info | travaux | canicule`).
4. **`POOLS[].schedules`** — les périodes d'horaires :
   `{ from, to, open, close, days, note }` — `open/close` en heures décimales (20.5 = 20 h 30),
   `days: "all" | "weekdays" | "weekends" | [0..6]`.

> ⚠️ **Fiabilité** — application indépendante : vérifiez toujours l'horaire du jour sur le
> [site officiel](https://metropole.toulouse.fr/sortir/sport/les-piscines-toulousaines).
> `Jean Boiteux — Espace Job` = la piscine du quartier Sept Deniers (même équipement),
> **fermée au public l'été**. Horaires de La Ramée Plage à confirmer.

### Actualisation automatique (Routine) & bouton ↻

- **Côté données** : une tâche planifiée Claude (rattachée à la session principale du
  projet — les sessions fraîches n'ont pas les droits de push sur la branche) passe chaque
  semaine et suit [`tools/refresh-instructions.md`](tools/refresh-instructions.md) : elle
  tient à jour l'alerte et les actus (recherche web, `tools/export-data.mjs`, garde-fou
  `tools/check.mjs`), et **ne modifie jamais un horaire** : elle le signale dans son message
  de commit et sa notification.
- **Côté app** : les données vivent aussi dans **`data.json`**, rechargé par l'app
  (installée ou non) au lancement, toutes les 15 min, et via le **bouton ↻** de la
  barre du haut — les mises à jour atteignent donc les téléphones **sans réinstaller**.
  Une nouvelle version du code s'affiche au plus tard à la 2ᵉ ouverture (`tools/sw-test.mjs`).

---

## ▶️ Lancer & 🚀 déployer

- **Local** : ouvrez `index.html` (les tuiles de carte se chargent si vous êtes en ligne).
  Pour la PWA/hors-ligne, servez le dossier : `python3 -m http.server 8080`.
- **GitHub Pages** : `Settings → Pages`, branche + dossier racine (`.nojekyll` déjà présent).
- **Carte** : les tuiles du Plan IGN viennent de `data.geopf.fr` et nécessitent Internet
  (le navigateur les garde lui-même quelques semaines). Si elles ne se chargent pas, un
  message le signale et les points restent cliquables.

## 📱 Mobile

**Pas à pas : [`docs/INSTALL-MOBILE.md`](docs/INSTALL-MOBILE.md).** Sur Android (Chrome)
ou iOS (Safari) → « Ajouter à l'écran d'accueil ». Une app native (store) n'est pas faite :
c'est une idée, voir [`docs/IDEES.md`](docs/IDEES.md).

---

## 🗂️ Structure & build

```
index.html               ← l'app (autonome : police + Leaflet + données + logique inline)
manifest.webmanifest · sw.js · icons/   ← PWA
tools/build.mjs          ← injecte police (data-URI) + Leaflet, génère la version artifact
tools/render.mjs         ← captures de vérification (Chromium) ; `--icons` régénère les icônes PNG
tools/check.mjs          ← données + affichage honnête sur 14 jours + textes sûrs (Node seul)
tools/map-align-test.mjs ← carte : vraies tuiles (images différentes) + marqueurs alignés
tools/screen-test.mjs    ← écran à 390 px : phrases justes, mise en page, curseur, textes piégés
tools/sw-test.mjs        ← cache du téléphone : rien d'un autre site, mise à jour en 2 ouvertures
tools/sources/ · tools/compare-sources.mjs · sources/mairie/   ← comparaison avec les fiches officielles
tools/publish.mjs        ← publication seulement si tout passe
```
Détail et raisons : [`docs/CONSTRUCTION.md`](docs/CONSTRUCTION.md).

Rebuild du gabarit (si vous ré-éditez les placeholders `__FONT_DATA_URI__` /
`__LEAFLET_CSS__` / `__LEAFLET_JS__`) :
```bash
npm pack @fontsource-variable/bricolage-grotesque   # → woff2 → base64 → bricolage.b64
npm pack leaflet@1                                   # → dist/leaflet.css + leaflet.js
node tools/build.mjs bricolage.b64 leaflet.css leaflet.js artifact.html
```

Police **Bricolage Grotesque** (SIL OFL) et **Leaflet** 1.9.4 (BSD-2) embarqués.
Fond de carte : Plan IGN © IGN (Licence Ouverte). Projet indépendant, non affilié à la Mairie de Toulouse.
