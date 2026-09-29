# 🔄 Routine d'actualisation des données — mode d'emploi (session planifiée)

Ce document est la **feuille de mission** exécutée automatiquement par une session
Claude Code planifiée (Routine). Il est aussi valable pour une mise à jour manuelle.
Objectif : garder l'**alerte en cours** et les **actus** des piscines de Toulouse à jour,
en **modifiant uniquement les blocs de données** de `index.html`, et **signaler** (sans les
modifier) les horaires qui semblent avoir changé.

> ⛔ **Tu ne modifies JAMAIS un horaire.** Ni `POOLS[].schedules`, ni `closedInSummer`, ni
> `ALERT.overrides`, ni une heure écrite dans un texte (titre, détail, actu). Les horaires ne
> viennent que des fiches officielles de la Mairie, relues depuis le PC de Maxime
> (`npm run compare`) ; une recherche web ne suffit pas (décision de Maxime, 29/09/2026).
> Si tu trouves un horaire différent : **tu le signales** (étape 3), point.

## Contexte
- Dépôt : `maximerolando/spool`, branche **`claude/toulouse-pools-dashboard-31xhxb`**.
- Toute la logique/carte est déjà embarquée dans `index.html`. **Ne touche pas** au
  gabarit ni au code : seuls comptent les blocs en tête du `<script>`, et tu n'y touches
  qu'à `META.updated`, `ALERT` (sauf `overrides`) et `NEWS`. Ne touche pas à `META.minApp`.
- ⚠️ Le site officiel `metropole.toulouse.fr` et `data.toulouse-metropole.fr` sont
  souvent **bloqués** depuis l'environnement de build. Utilise **WebSearch** (qui
  fonctionne) et recoupe au moins deux sources avant de changer une donnée.

## Étapes
1. **Se placer sur la branche** et récupérer le dernier état :
   `git fetch origin && git checkout claude/toulouse-pools-dashboard-31xhxb && git pull`.
2. **Alerte en cours** (`ALERT`) — le plus volatil, à vérifier en premier.
   Cherche « piscines Toulouse canicule mesures horaires » + « fermeture piscine Toulouse ».
   - Alerte active (canicule, etc.) → `ALERT.active=true`, `from`/`to`, `title`, `tarif`,
     `detail` (sans aucune heure). Des horaires prolongés annoncés → **signale-les** (étape 3).
   - Plus d'alerte → `ALERT.active=false`. Ajoute une entrée `NEWS` qui explique le
     changement (type `canicule`/`info`).
3. **Horaires : signaler, jamais modifier.** Si une source annonce un horaire, une fermeture ou
   une réouverture différente de ce que contient `POOLS` : ne change rien dans les données, et
   écris-le dans le **message de commit**, sous un titre exact
   `À VÉRIFIER — horaires signalés (non modifiés)`, une ligne par piscine :
   `- <id> : <ce que dit la source> (source : <adresse>, vue le AAAA-MM-JJ)`.
   Reprends-le dans la notification (étape 9). S'il n'y a rien d'autre à changer, fais quand
   même le commit (tampon `META.updated`) pour que le signalement soit enregistré.
4. **Actus** (`NEWS[]`) — ajoute les nouveautés datées (ouverture/fermeture/travaux), sans
   heure d'ouverture dans le texte. Garde ~10 entrées max, les plus récentes en premier.
   Textes : jamais de `<` ni de `>` ; aucun lien (les fiches officielles sont déjà liées).
5. **Tampon** : mets `META.updated` = date du jour (AAAA-MM-JJ).
6. **Exporte + vérifie** :
   `node tools/export-data.mjs && node tools/check.mjs`
   (`export-data` régénère `data.json`, que les apps installées rechargent au
   lancement / toutes les 15 min / via le bouton ↻ ; `check` doit finir par
   « ✓ Données valides » — corrige toute erreur avant de committer.)
7. **Commit + push** sur la branche (jamais `main`, pas de PR sauf demande) :
   `git add index.html data.json && git commit -m "chore(data): actualisation horaires/alerte piscines (AAAA-MM-JJ)"`
   puis `git push -u origin claude/toulouse-pools-dashboard-31xhxb`.
   ⚠ Le push doit se faire **depuis la session principale du dashboard** (la
   Routine y est rattachée) : les sessions fraîches n'ont pas les droits sur
   cette branche (erreur 403 sinon).
8. **Aperçu** (si l'artifact de la session est utilisé) : régénère puis republie —
   `node tools/build.mjs /dev/null /dev/null /dev/null <scratchpad>/artifact.html`
   puis l'outil Artifact avec ce même chemin.
9. **Notification** : envoie une notification push (outil PushNotification) d'une
   phrase : ce qui a changé, ou « RAS — données déjà à jour ».

## Coordonnées GPS (qualité)

Vérifiées type RES (±20 m, ne pas toucher sauf source meilleure) : nakache-ete,
castex, toulouse-lautrec, yvonne-godard, jean-boiteux, la-ramee-plage, bellevue.
Approximatives (±100-250 m, à affiner si une source numérique fiable apparaît —
cartes-2-france/webvilles/gralon publient les décimales du recensement des
équipements sportifs) : chapou-ete, alex-jany, papus, la-faourette,
alban-minville, leo-lagrange. L'utilisateur peut aussi fournir des corrections
via Maj+clic sur la carte de l'app.

## Affichage honnête (vérifié par `node tools/check.mjs`)
- Une piscine sans période d'horaires couvrant la date s'affiche « horaires non connus » avec
  le lien officiel, **jamais « Fermée »**. Pour afficher une fermeture, il faut qu'elle soit
  encodée : une période qui couvre les dates (les jours hors `days` sont alors fermés), ou
  `closedInSummer:true` pendant la saison d'été.
- Plus de 10 jours après `META.updated`, l'appli passe tout en « horaires non connus » : ne
  mets à jour `META.updated` qu'après une vraie vérification.
- Si `check` échoue sur un horaire (« ✗ Affichage faux »), **ne pousse pas** : annule tes
  changements et signale-le dans la notification (tu ne corriges jamais un horaire).
- Si `check` refuse un texte (« < » ou « > », lien hors du site de la Mairie), réécris le texte.
- Ne modifie pas `sources/mairie/` : ce sont les versions validées des fiches officielles,
  mises à jour depuis le PC de Maxime (`npm run compare`).

## Règles de prudence
- **Conservateur** : dans le doute, ne change rien et note l'incertitude dans le message
  de commit. Mieux vaut une donnée « à confirmer » qu'une fausse certitude.
- **Changements minimes et ciblés** (valeurs de données), jamais de refactor.
- Ne modifie pas d'autres fichiers que `index.html` et `data.json` (régénéré par `export-data`).
- Toujours laisser `node tools/check.mjs` au vert.
- Récap clair dans le message de commit : ce qui a changé et la source.
