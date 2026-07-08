# 🏊 Piscines de Toulouse — Écran d'info estival

Un tableau de bord **ambiant, façon écran connecté (type Echo Show)** pour suivre en un
coup d'œil les **piscines municipales de Toulouse** pendant l'été : qui est **ouvert ou
fermé maintenant**, où aller, à quelle heure, et les **mesures exceptionnelles** (canicule).

Tout tient dans **un seul `index.html` autonome** : police, données, logique et la
bibliothèque de carte sont embarquées. Aucune dépendance, aucun serveur requis.
Seules les **tuiles de la carte** se chargent en ligne (voir plus bas).

---

## ✨ Les vues

| Vue | Contenu |
|-----|---------|
| **En direct** | Horloge, nombre de piscines **ouvertes à l'instant**, bandeau **canicule** (1 € + horaires étendus), et surtout le **Tableau des horaires** : toutes les amplitudes d'ouverture **alignées** sur un même axe, avec une **ligne « maintenant »** qui traverse tout — on voit d'un coup qui est ouvert, qui ouvre plus tard, qui a déjà fermé. |
| **Carte** | **Vraie carte** (OpenStreetMap / CARTO via Leaflet) avec un marqueur par piscine **coloré selon l'état en direct**. Clic → fiche + bouton **Itinéraire** qui ouvre l'app de navigation. |
| **Les piscines** | Annuaire filtrable (statut, type, 50 m, recherche) avec **fiche détaillée** par piscine. |
| **Infos & actus** | Fil d'actualités, alerte canicule, règles (bonnet, tenue, tarif), sources. |

**États de couleur** (dans le tableau, la carte et les fiches) :
🟢 ouverte maintenant · 🔵 ouvre plus tard aujourd'hui · 🟠 déjà fermée aujourd'hui ·
🟣 à venir (ouvre un autre jour) · 🔴 fermée pour la saison.

Bonus : **thème clair/sombre**, **mode kiosque** plein écran (les vues défilent seules),
**PWA installable** sur téléphone, statut **recalculé toutes les 30 s**.

---

## 🧠 Données : automatique quand c'est prévisible, manuel sinon

Les **horaires de saison** sont encodés ; le statut ouvert/fermé se **recalcule tout seul**
selon la date et l'heure. Rien à faire au quotidien. Ce qui n'est pas prévisible (canicule,
rénovation, incident) s'édite à la main lors d'un passage.

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

> ⚠️ **Fiabilité** — horaires **indicatifs** agrégés depuis des sources publiques (le réseau
> de l'environnement de build bloque le site officiel, données recoupées via recherche).
> Vérifiez toujours l'horaire du jour sur le
> [site officiel](https://metropole.toulouse.fr/sortir/sport/les-piscines-toulousaines).
> `Jean Boiteux — Espace Job` = la piscine du quartier Sept Deniers (même équipement),
> **fermée au public l'été**. Horaires de La Ramée Plage à confirmer.

### Actualisation automatique (Routine)

Une session Claude Code planifiée peut ré-actualiser les données toute seule en suivant
[`tools/refresh-instructions.md`](tools/refresh-instructions.md) : elle vérifie l'alerte
en cours, les horaires et les actus (via recherche web), lance `node tools/check.mjs`,
puis commit/push sur la branche. Garde-fou intégrité : `tools/check.mjs`.

---

## ▶️ Lancer & 🚀 déployer

- **Local** : ouvrez `index.html` (les tuiles de carte se chargent si vous êtes en ligne).
  Pour la PWA/hors-ligne, servez le dossier : `python3 -m http.server 8080`.
- **GitHub Pages** : `Settings → Pages`, branche + dossier racine (`.nojekyll` déjà présent).
- **Carte** : les tuiles viennent d'OpenStreetMap/CARTO et nécessitent Internet. Dans
  l'aperçu Claude (CSP stricte) elles n'apparaissent pas — un message le signale, les
  points restent cliquables. En hébergé/local, la carte s'affiche pleinement.

## 📱 Mobile

**Tuto complet pas à pas : [`docs/INSTALL-MOBILE.md`](docs/INSTALL-MOBILE.md)** (PWA + Capacitor Android/iOS).

- **PWA** : sur Android (Chrome) ou iOS (Safari) → « Ajouter à l'écran d'accueil ».
- **App Android native** (`.apk`/Play Store) via **Capacitor** — enveloppe ce même
  `index.html`, un seul code, iOS en second temps :
  ```bash
  npm i -D @capacitor/cli @capacitor/core @capacitor/android
  npx cap init "Piscines TLS" fr.toulouse.piscines --web-dir=.
  npx cap add android && npx cap sync && npx cap open android
  ```

---

## 🗂️ Structure & build

```
index.html               ← l'app (autonome : police + Leaflet + données + logique inline)
manifest.webmanifest · sw.js · icons/   ← PWA
tools/build.mjs          ← injecte police (data-URI) + Leaflet, génère la version artifact
tools/render.mjs         ← génère les icônes PNG et des captures de vérification (Chromium)
```

Rebuild du gabarit (si vous ré-éditez les placeholders `__FONT_DATA_URI__` /
`__LEAFLET_CSS__` / `__LEAFLET_JS__`) :
```bash
npm pack @fontsource-variable/bricolage-grotesque   # → woff2 → base64 → bricolage.b64
npm pack leaflet@1                                   # → dist/leaflet.css + leaflet.js
node tools/build.mjs bricolage.b64 leaflet.css leaflet.js artifact.html
```

Police **Bricolage Grotesque** (SIL OFL) et **Leaflet** 1.9.4 (BSD-2) embarqués.
Fonds de carte © OpenStreetMap, © CARTO. Projet indépendant, non affilié à la Mairie de Toulouse.
