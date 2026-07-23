# 🔄 Routine d'actualisation des données — mode d'emploi (session planifiée)

Ce document est la **feuille de mission** exécutée automatiquement par une session
Claude Code planifiée (Routine). Il est aussi valable pour une mise à jour manuelle.
Objectif : garder les **horaires**, l'**alerte en cours** et les **actus** des piscines
de Toulouse à jour, en **modifiant uniquement les blocs de données** de `index.html`.

## Contexte
- Dépôt : `maximerolando/spool`, branche **`claude/toulouse-pools-dashboard-31xhxb`**.
- Toute la logique/carte est déjà embarquée dans `index.html`. **Ne touche pas** au
  gabarit ni au code : seuls comptent les 4 blocs en tête du `<script>` :
  `META`, `ALERT`, `NEWS`, `POOLS[].schedules`.
- ⚠️ Le site officiel `metropole.toulouse.fr` et `data.toulouse-metropole.fr` sont
  souvent **bloqués** depuis l'environnement de build. Utilise **WebSearch** (qui
  fonctionne) et recoupe au moins deux sources avant de changer une donnée.

## Étapes
1. **Se placer sur la branche** et récupérer le dernier état :
   `git fetch origin && git checkout claude/toulouse-pools-dashboard-31xhxb && git pull`.
2. **Alerte en cours** (`ALERT`) — le plus volatil, à vérifier en premier.
   Cherche « piscines Toulouse canicule mesures horaires » + « fermeture piscine Toulouse ».
   - Alerte active (canicule, etc.) → `ALERT.active=true`, `from`/`to`, `tarif`, et
     `overrides` par piscine (`{close:21}`, ou `{weekend:{open,close}}`).
   - Plus d'alerte → `ALERT.active=false`. Ajoute une entrée `NEWS` qui explique le
     changement (type `canicule`/`info`).
3. **Horaires de saison** (`POOLS[].schedules`) — pour chaque piscine, cherche
   « piscine <nom> Toulouse horaires été » et corrige `from/to/open/close/days` si un
   changement est **clairement** corroboré. Heures décimales (20.5 = 20 h 30).
   - Piscine fermée l'été → `closedInSummer:true` **et** `schedules:[]`.
   - **Exemple validé** : `jean-boiteux` (Espace Job, quartier Sept Deniers) est
     **fermée au public l'été** → `closedInSummer:true`, `schedules:[]`.
     `sept-deniers` et `jean-boiteux` sont **le même équipement** : n'en garde qu'un.
4. **Actus** (`NEWS[]`) — ajoute les nouveautés datées (ouverture/fermeture/travaux).
   Garde ~10 entrées max, les plus récentes en premier.
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

## Règles de prudence
- **Conservateur** : dans le doute, ne change rien et note l'incertitude dans le message
  de commit. Mieux vaut une donnée « à confirmer » qu'une fausse certitude.
- **Changements minimes et ciblés** (valeurs de données), jamais de refactor.
- Ne modifie pas d'autres fichiers que `index.html` (et éventuellement `README`).
- Toujours laisser `node tools/check.mjs` au vert.
- Récap clair dans le message de commit : ce qui a changé et la source.
