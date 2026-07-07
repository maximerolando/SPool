# 🏊 Piscines de Toulouse — Écran d'info estival

Un tableau de bord **ambiant, façon écran connecté (type Echo Show)** pour suivre en un
coup d'œil les **piscines municipales de Toulouse** pendant la saison estivale :
qui est **ouvert ou fermé en direct**, où se trouvent les bassins, les **horaires d'été**,
le **calendrier de la saison** et les **actualités**.

Le tout dans **un seul fichier `index.html` autonome** : police, données et logique
sont embarquées — aucune dépendance réseau, aucun serveur requis. Ça marche hors-ligne.

---

## ✨ Ce qu'on y trouve

5 vues, accessibles par onglets (et qui défilent toutes seules en **mode kiosque**) :

| Vue | Contenu |
|-----|---------|
| **En direct** | Grande horloge, nombre de piscines **ouvertes à l'instant**, compte à rebours « ferme dans X », prochains changements, dernière actu, chiffres clés + astuce. |
| **Carte** | Carte schématique de Toulouse (Garonne, périphérique, secteurs) avec un marqueur par piscine, **coloré selon le statut du jour** (vert = ouverte, rouge = fermée, ☀️ = plein air). |
| **Calendrier** | Un mois à la fois : nombre de piscines ouvertes chaque jour + **événements de saison** (ouvertures / fermetures). Cliquez un jour pour le détail. |
| **Les piscines** | Annuaire filtrable (statut, type, 50 m, recherche) avec une **fiche détaillée** par piscine (horaires, amplitude d'ouverture, bassins, règles, itinéraire). |
| **Infos & actus** | Fil d'actualités de la saison, règles (bonnet, tenue), sources et date de mise à jour. |

Autres bonus : **thème clair / sombre** (suit le système + bouton bascule), **mode kiosque
plein écran** avec rotation automatique des vues, **PWA installable** sur téléphone,
et un **statut recalculé en direct** toutes les 30 secondes.

---

## 🧠 Des données qui se mettent à jour toutes seules (autant que possible)

Tout ce qui est **prévisible** — les horaires et les périodes de la saison — est **encodé**.
Le statut « ouvert / fermé » et le calendrier se **recalculent automatiquement** à partir de
la date du jour. Il n'y a donc **rien à faire au quotidien** : demain, la veille d'une
fermeture ou en septembre, l'écran affichera le bon statut sans intervention.

Ce qui **ne peut pas** être deviné (une rénovation, un incident, une fermeture technique,
un événement) vit dans une liste `NEWS` **facile à éditer à la main** lors d'un passage.

### Comment mettre à jour (lors d'un passage avec Claude Code)

Tout est en haut du `<script>` dans `index.html`, bien commenté :

1. **`META.updated`** — la date de votre passage.
2. **`NEWS[]`** — ajoutez les actualités ponctuelles (`type: ouverture | fermeture | info | travaux`).
3. **`POOLS[].schedules`** — les horaires prévisibles. Chaque période est un objet :
   ```js
   { from:"2026-07-04", to:"2026-08-30", open:10, close:20.5, days:"all", note:"horaires d'été" }
   // open/close en heures décimales (20.5 = 20 h 30) ; days: "all" | "weekdays" | "weekends" | [0..6]
   ```

Carte, calendrier, live et fiches se régénèrent à partir de ces trois blocs.

> ⚠️ **Fiabilité des données** — les horaires sont **indicatifs** (agrégés depuis des sources
> publiques). Certaines valeurs sont arrondies et deux petits bassins (Sept Deniers, Jean
> Boiteux) sont supposés fermés l'été. Vérifiez toujours l'horaire du jour sur le
> [site officiel](https://metropole.toulouse.fr/sortir/sport/les-piscines-toulousaines).

---

## ▶️ Lancer en local

Ouvrez simplement `index.html` dans un navigateur. Pour que la **PWA / le service worker**
fonctionne (installation, hors-ligne), servez le dossier en HTTP :

```bash
python3 -m http.server 8080
# puis http://localhost:8080
```

## 🚀 Déployer (GitHub Pages)

`Settings → Pages → Deploy from a branch`, dossier racine. Le fichier `.nojekyll` évite
tout traitement Jekyll. L'écran est alors accessible depuis n'importe quel appareil du réseau.

## 📱 Installer sur téléphone (PWA)

Ouvrez l'URL déployée sur Android (Chrome) ou iOS (Safari) → menu → **« Ajouter à l'écran
d'accueil »**. L'app s'installe en plein écran, avec icône, et fonctionne hors-ligne.
C'est la première marche vers l'application mobile.

---

## 🛣️ Feuille de route — application mobile

- [x] **PWA installable** (Android + iOS) — fait, via `manifest.webmanifest` + `sw.js`.
- [ ] **App Android native** (`.apk` / Play Store) via **Capacitor** — enveloppe le même
      `index.html`, donc **un seul code** à maintenir :
  ```bash
  npm i -D @capacitor/cli @capacitor/core @capacitor/android
  npx cap init "Piscines TLS" fr.toulouse.piscines --web-dir=.
  npx cap add android
  npx cap sync
  npx cap open android      # build de l'APK dans Android Studio
  ```
- [ ] **App iOS** — `npx cap add ios` (même base), à activer dans un second temps.

---

## 🗂️ Structure

```
index.html               ← l'application (autonome : police + données + logique)
manifest.webmanifest     ← métadonnées PWA
sw.js                    ← service worker (cache hors-ligne)
icons/                   ← icône SVG + PNG (192, 512, maskable)
tools/
  build.mjs              ← injecte la police en data-URI + génère la version « artifact »
  render.mjs             ← génère les icônes PNG et les captures de vérification (Chromium)
```

La police **Bricolage Grotesque** (SIL OFL) est embarquée en data-URI. Pour la ré-injecter
après une mise à jour du gabarit :
`node tools/build.mjs chemin/vers/bricolage.b64`.

---

## 📚 Sources

- [Toulouse Métropole — les piscines](https://metropole.toulouse.fr/sortir/sport/les-piscines-toulousaines)
- [Les piscines à l'heure d'été](https://metropole.toulouse.fr/actualites/les-piscines-lheure-dete)
- [Open Data Toulouse — jeu de données « piscines »](https://data.toulouse-metropole.fr/explore/dataset/piscines/table/)

Projet indépendant, **non affilié** à la Mairie de Toulouse.
