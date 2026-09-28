# SPool — piscines de Toulouse

Site statique : **un seul `index.html` autonome** (police, Leaflet, données et logique inline) qui
affiche l'état en direct des piscines municipales de Toulouse (tableau des horaires, carte,
annuaire, actus). Publié par **GitHub Pages** depuis la branche
`claude/toulouse-pools-dashboard-31xhxb` (ne pas la renommer). Les données vivent dans les blocs
`META` / `ALERT` / `NEWS` / `POOLS` en tête du `<script>`, et sont exportées dans `data.json`
(rechargé par l'app installée).

## Avant de travailler

**Toujours `git pull` d'abord** : une tâche planifiée Claude dans le cloud pousse des mises à jour
de données sur cette branche (voir `tools/refresh-instructions.md`).

## Lancer et vérifier en local

```bash
npm install            # une seule dépendance de dev : playwright-core (pour les captures)
npm run check          # node tools/check.mjs : données + affichage honnête sur 14 jours (« ✓ Affichage honnête »)
npm run serve          # http://localhost:8080 (ou ouvrir index.html directement)
npm run render         # captures dans $TMPDIR/spool-shots + détection d'erreurs JS (--icons régénère les PNG)
npm run map-test       # alignement des marqueurs de la carte
npm run verify         # les trois vérifications d'un coup
npm run compare        # fiches officielles de la Mairie vs dernière version validée (sources/mairie/) — depuis ce PC
npm run publish        # pull --rebase → vérifications → règle du cache sw.js → push (-- --dry-run : sans push)
```

Les scripts navigateur trouvent Chrome tout seuls (`$CHROME_PATH`, sinon Chromium de Playwright,
sinon Google Chrome du système). Après une édition des données : `npm run export` (régénère
`data.json` puis relance le check).

## Règles

1. **L'appli n'affiche jamais un état faux.** Pour une piscine sans horaire connu à la date
   affichée, on montre « horaires non connus » avec le lien officiel
   (https://metropole.toulouse.fr/sortir/sport/les-piscines-toulousaines), **jamais « Fermée »**.
   « Fermée » n'est affiché que lorsqu'une fermeture est connue et sourcée.
2. **Ne jamais casser la tâche planifiée du cloud.** Elle ne fait que `node tools/export-data.mjs`
   et `node tools/check.mjs` (Node seul, **sans `npm install`**), édite les blocs de données de
   `index.html` et pousse sur cette branche. Donc : garder ces deux scripts sans dépendance, garder
   les marqueurs `let META =` … `MOTEUR` et la forme des données, ne pas renommer la branche ni
   déplacer `tools/refresh-instructions.md`, et laisser `npm run check` au vert.
3. **Publier = `npm run publish`, jamais `git push` direct, et seulement après l'accord de
   Maxime.** Un changement du code de `index.html` (hors blocs de données) exige un nouveau nom
   de cache dans `sw.js` (`const CACHE = "…-vN"`), sinon les téléphones gardent l'ancienne version.
4. **Les données viennent des fiches officielles.** La Mairie est la vérité, lue depuis ce PC
   par `npm run compare`. Après avoir corrigé les données selon un écart, valider avec
   `node tools/compare-sources.mjs --accept` (les fichiers `sources/mairie/` sont versionnés :
   leur historique est la preuve des vérifications).
5. **Outils : n'en ajouter que s'ils garantissent quelque chose de précis ici.** Chaque outil a
   un test qui le fait échouer exprès et un critère de retrait (voir `docs/CONSTRUCTION.md`).
   Une idée non retenue va dans `docs/IDEES.md`, pas dans le code.

## Maxime parle, Claude fait

Maxime dicte souvent à la voix : répondre en mots simples, court, sans jargon.

| Maxime dit… | Claude fait |
|---|---|
| « vérifie les piscines » | `git pull`, `npm run compare`, explique chaque écart ; propose les corrections de données ; après accord : édite, `npm run export`, `--accept`, commit, puis demande pour publier |
| « change X dans l'appli » | modifie, `npm run check` + `npm run render`, montre les captures ; nouveau nom de cache `sw.js` si le code a changé ; commit |
| « montre-moi » | `npm run render` et montre les captures (ou `npm run serve` pour l'ouvrir dans le navigateur) |
| « publie » | `npm run publish` ; en cas de refus, explique la raison en une phrase et corrige |
| « note l'idée » | ajoute-la à `docs/IDEES.md` |
