# Mesures — ce que les contrôles ont trouvé, et ce qui prouve qu'ils marchent

Deux listes séparées : les défauts **réels**, trouvés dans l'appli en ligne, puis la
**sensibilité** des contrôles, prouvée en les sabotant exprès. Les sorties brutes sont dans
[`preuves/`](preuves/).

## 1. Trouvé en vrai (dans l'appli en ligne)

| Défaut réel | Trouvé par | Ce que disaient les contrôles d'alors |
|---|---|---|
| **13 piscines sur 13 affichées « Fermée » sans source**, à chaque instant testé : 364 points (13 piscines × 14 jours × 2 heures), 28/09 | la nouvelle vérification d'affichage (`check`), écrite pour ça | « ✓ Données valides » |
| **La carte sans rues** : le fournisseur (CARTO) répond « 200 OK » avec la même image « API KEY REQUIRED » partout — 18 tuiles reçues, 1 seule image | une revue extérieure (lecture seule), 28/09 au soir ; confirmé par le nouveau détecteur de `map-align-test` | `render`, `map-test` et `check` : tous verts |
| **Injection** : un titre d'actualité piégé (`<img onerror>`) s'exécutait dans l'appli, alors que ces textes sont écrits par un robot d'après le web | la revue extérieure ; confirmé dans une copie (le code piégé s'exécute) | « ✓ Données valides » |
| **L'alerte canicule de juillet** encore affichée fin septembre : la tâche du cloud était restée muette deux mois, sans que personne soit prévenu | constat du 26/09 | rien ne surveillait l'âge des données |
| Téléphones **bloqués sur leur ancienne version** : le service worker préchargeait l'ancienne page gardée par le navigateur ; nouvelle version jamais vue en 3 ouvertures | la revue extérieure ; confirmé par `sw-test` | rien ne testait la mise à jour |
| Le cache du téléphone gardait **les tuiles d'un autre site** (l'image de refus, figée) et **une copie de `data.json` par actualisation** (7 après 6) | la revue extérieure ; confirmé par `sw-test` | — |
| **Phrases qui disaient plus que l'appli ne savait** : astuce « Canicule : 1 € et 21 h » sans alerte, « saison estivale » fin septembre, « Aucune piscine ne correspond » alors que rien n'est connu, « Horaires de la saison » (ceux de l'été, passés), un numéro de téléphone introuvable sur les fiches officielles | la revue extérieure (en partie) ; `screen-test` en a relevé 15 à trois moments | — |
| « 0 ouverte maintenant » alors qu'on ne sait rien | la capture d'écran (`render`), 28/09 — le compteur est hors du calcul testé par `check` | — |
| **À 390 px** (iPhone courant) : 2 onglets sur 4 hors de l'écran, 15 textes coupés (« Horaires non conn ») ; le curseur clavier renvoyé en haut toutes les 30 s | la revue extérieure ; confirmé par `screen-test` | — |
| Fiche officielle de la Faourette en 404 ; Nakache hiver absente de SPool ; lien de Nakache été redirigé ; Nakache été fermée jusqu'en 2027 ; 150 m × 48 m et non « 50 m » | `compare` (fiches de la Mairie), 28/09 | — |

## 2. Sensibilité des contrôles, prouvée en sabotant exprès

Chaque sabotage est fait dans une copie jetable ; le contrôle visé doit refuser, et seulement pour
ce défaut.

| Sabotage | Contrôle | Résultat |
|---|---|---|
| Ancien calcul (« Fermée » par défaut) | `check` | refusé : 364 cas |
| Seuil de 10 jours passé à 30 + une piscine avec horaires sur un mois | `check` | refusé : « Ouverte alors que les données ont 11 jours » |
| Titre d'actualité avec `<img onerror>` ; lien hors du site de la Mairie | `check` | refusé, les deux |
| `META.minApp` ajouté sans régénérer `data.json` | `check` | refusé : « data.json ne correspond pas aux blocs » |
| Données qui exigent une appli plus récente (`minApp` 5, appli 4) | `check` | refusé |
| Une ligne changée dans une fiche validée (`sources/mairie/papus.txt`) | `compare` | signalé : « − Samedi : 9h30 - 17h / + Samedi : 9h30 - 15h » |
| Code modifié sans nouveau nom de cache ; piscine placée à Paris ; modification non commitée | `publish` | refusé, les trois ; la vraie correction passe |
| Adresse des tuiles cassée | `map-align-test` | refusé : « Aucune tuile reçue » |
| Installation du service worker sans contourner le cache du navigateur | `sw-test` | refusé : nouvelle version jamais vue |
| Tuiles d'un autre site de nouveau mises en cache | `sw-test` | refusé : 6 entrées d'un autre site |
| Neutralisation des textes désactivée | `screen-test` | refusé : 6 exécutions du code piégé |
| Tableau réécrit sans garder le curseur | `screen-test` | refusé : le focus part sur la page |
| Le numéro sans source remis dans les astuces | `screen-test` | refusé, aux 3 moments |
| Robot rejoué avec deux faux articles annonçant de nouveaux horaires pour Papus | lecture de son commit | aucun horaire modifié, Papus signalé sous « À VÉRIFIER » ([rejeu](preuves/robot-rejeu-v4.txt)) |

Détail des sorties : [`preuves/sabotages-v4.txt`](preuves/sabotages-v4.txt), et les refus de la
version d'avant ([écran](preuves/ecran-refus-avant-v4.txt), [cache](preuves/cache-refus-avant-v4.txt),
[carte](preuves/carte-refus-avant-v4.txt), [injection](preuves/injection-refus-v4.txt)).

**Les contrôles aussi ont été contrôlés.** Avant de leur faire confiance, quatre défauts ont été
trouvés dans les nouveaux tests eux-mêmes :
- un texte lu sur une copie détachée de la page, qui incluait donc le texte caché ;
- une attente qui rendait la main tout de suite sur une fonction asynchrone ;
- un rechargement forcé qui contournait le service worker ;
- des styles placés dans le mauvais bloc.

Chaque fois, c'est un résultat trop beau ou incohérent qui les a fait repérer. Les preuves
« avant » viennent des tests corrigés, relancés sur la version d'avant.

## 3. Sur le téléphone

29/09, après la publication de la v4 : Maxime ouvre l'appli installée deux fois. À la 2ᵉ
ouverture, « tout est bon » : la carte a ses rues et le crédit IGN, les 4 onglets sont
visibles, « Horaires non connus » se lit en entier.

## Ce qui a pris du temps, ou a failli mal tourner

- **Monter les tests d'échec de la publication** : il fallait une copie jetable du dépôt, avec un
  faux GitHub local, pour ne rien envoyer par erreur. Deux essais ratés avant le bon.
- **Identité git** : l'identité git par défaut ne convenait pas à un dépôt public → adresse GitHub
  privée, pour ce dépôt seulement.
- **Un en-tête HTTP avec des accents** faisait échouer silencieusement toute la collecte des
  fiches (13 « statut 0 »). Repéré au premier essai, corrigé.
- **La mise à jour des téléphones** : le navigateur vérifie un nouveau `sw.js` quand il veut ; il
  a fallu que l'appli le demande à chaque ouverture pour que « 2 ouvertures » soit vrai.
- **Une erreur d'annonce** (28/09) : une heure donnée de mémoire, corrigée aussitôt. Les heures
  ci-dessous viennent toutes de l'horloge.

---

## Mesure interne, pas un argument

Heures relevées avec l'horloge du PC (`date`). Les attentes de réponse de Maxime sont incluses.

**28/09 — premier setup**

| Étape | Heure |
|---|---|
| Préparation (session du matin) | fichiers datés de 10 h 50 à 11 h 00 (dates de fichiers, pas des heures relevées) |
| Début | 11 h 19 |
| Plan validé | 11 h 36 |
| Installation terminée | 11 h 40 |
| « Horaires non connus » publié, vérifié en ligne | 11 h 46 – 11 h 47 |
| Fin (comparaison Mairie, documentation, 2ᵉ publication) | 11 h 51 |

**28–29/09 — v4**

| Étape | Heure |
|---|---|
| Fiche reçue, preuves (carte, injection, cache) | 28/09 23 h 00 – 23 h 05 |
| 1er arrêt : Plan IGN choisi par Maxime | réponse reçue le 29/09 au matin |
| Corrections, contrôles, sabotages, rejeu du robot, commits | 29/09 10 h 26 – 10 h 50 |
| 2ᵉ arrêt : « publie » ; v4 publiée | 12 h 25 |
| Preuve en ligne ; téléphone de Maxime | 12 h 26 ; 12 h 33 |
