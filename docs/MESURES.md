# Mesures — installation du setup (28/09/2026)

Heures relevées avec l'horloge du PC (`date`) au moment de chaque étape.

## Chrono

| Étape | Heure | Durée |
|---|---|---|
| Préparation avant le chrono (session du matin : `package.json`, `tools/browser.mjs`, chemins cloud retirés, ébauche de `CLAUDE.md`) | fichiers datés de 10 h 50 à 11 h 00 | ≈ 10 min, **estimé d'après les dates des fichiers** : ce ne sont pas des heures relevées, et le début réel de cette session est inconnu |
| Début du chantier | 11 h 19 | — |
| Questions posées à Maxime, réponses reçues | ≈ 11 h 25 | 6 min (lecture du dépôt compris) |
| Plan validé | 11 h 36 | 11 min (lecture du code, essai de lecture du site de la Mairie, rédaction) |
| **Installation terminée** (4 pièces) | 11 h 40 | **4 min après le plan** · 21 min depuis le début |
| **Premier cycle réel** : correction « horaires non connus », captures, commits, tests d'échec exprès, accord de Maxime, publication | 11 h 46 (publié) | 6 min |
| Vérification sur le site en ligne (13 « Horaires non connus », compteur « ? ») | 11 h 47 | 1 min |
| Première comparaison Mairie + corrections sûres, documentation (cette page, CONSTRUCTION.md, IDEES.md), 2ᵉ publication | 11 h 50 | — |
| **Fin du chantier** | **11 h 50** | **total depuis le début : 11 h 19 → 11 h 50** (+ ≈ 10 min de préparation estimée) |

## Ce que les vérifications ont attrapé

| Quoi | Attrapé par | Détail |
|---|---|---|
| **« Fermée » affiché pour les 13 piscines, alors que l'ancienne vérification disait « valide »** | nouvelle vérification d'affichage (`check`) | 364 affichages faux sur 14 jours. C'était en ligne le matin même, *après* le rattrapage de données du cloud, qui pensait l'appli honnête. |
| « Fermée l'été · réouverture à la rentrée » pour Léo Lagrange et Jean Boiteux, fin septembre | `check` | La saison était finie : la mention n'avait plus de sens. |
| « 0 ouverte maintenant » alors qu'on ne sait rien | **capture d'écran** (`render`), pas `check` | Limite connue : le compteur est calculé hors du `MOTEUR`. |
| Lien officiel de la Faourette mort (404), piscine retirée de la liste officielle | `compare` | → IDEES.md |
| Nakache hiver absente de SPool | `compare` (liste officielle) | → IDEES.md |
| Lien de Nakache été redirigé | `compare` | Corrigé. |
| Nakache été : « Réouverture pour la saison estivale en 2027 » | lecture du texte collecté par `compare` | Ajouté à la note de la piscine. Pas de champ pour l'encoder → IDEES.md |
| Nakache été : 150 m × 48 m sur la fiche, « 50 m olympique » dans SPool | lecture du texte collecté | → IDEES.md |

Aucune publication n'a été refusée pendant le vrai cycle : la vérification tournait déjà *avant*
la demande de publication. Les refus ont tous été provoqués exprès (voir CONSTRUCTION.md).

## Ce qui a pris du temps, ou a failli mal tourner

- **Monter les tests d'échec de la publication** : il fallait une copie jetable du dépôt, avec un
  faux GitHub local, pour ne rien envoyer par erreur. Deux essais ratés (mauvaise option git, puis
  test lancé sur l'ancien code) avant le bon.
- **Identité git** : l'identité git par défaut ne convenait pas à un dépôt public → adresse GitHub
  privée, pour ce dépôt seulement.
- **Un en-tête HTTP avec des accents** faisait échouer silencieusement toute la collecte
  (13 fiches « statut 0 »). Repéré au premier essai, corrigé.
- **Une erreur d'annonce** : fin d'installation annoncée à « 11 h 58 » de mémoire, alors que
  l'horloge disait 11 h 40. Corrigée sur-le-champ. Les heures de cette page viennent toutes de
  l'horloge.
