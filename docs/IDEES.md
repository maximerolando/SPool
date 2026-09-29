# Idées et feuille de route

Tout ce qui a été envisagé sans être construit, avec la raison. On ne construit une idée que
quand elle garantit quelque chose de précis, ou qu'un vrai besoin se présente (voir la règle 5
de `CLAUDE.md`).

## Prochaines étapes (l'appli)

1. **Horaires en plusieurs créneaux** : par exemple Papus le jeudi, 7 h–9 h / 12 h–14 h /
   16 h–19 h. Le calcul actuel ne gère qu'une plage par jour. Toutes les piscines couvertes ont des
   créneaux fractionnés : sans ça, l'appli affiche « horaires non connus » tout l'hiver. C'est
   honnête, mais peu utile. **C'est la priorité.** Une session cloud l'avait commencée, puis
   abandonnée (28/09).
2. **Fermetures connues encodées** : Nakache été affiche « Réouverture pour la saison estivale en
   2027 » sur sa fiche. L'appli montre « non connus », faute de champ pour dire « fermée jusqu'au… ».
   Un champ `closures:[{from,to,source}]` le permettrait. Il faudrait l'ajouter à `check.mjs` et à
   la feuille de mission du cloud, sans casser la forme actuelle.
3. **Nakache hiver** : sur la liste officielle, absente de SPool. Il faut créer la fiche :
   adresse, coordonnées, bassins.
4. **La Faourette** : sa fiche officielle est en 404, et elle n'est plus sur la liste officielle.
   Fermeture ? Renommage ? À vérifier avant de la retirer ou de la corriger.
5. **Nakache été, dimensions** : la fiche officielle dit « 150 m × 48 m », SPool dit
   « 50 m olympique ». À corriger, et le compteur « bassins de 50 m » avec.
6. **La Ramée Plage** : la fiche est celle de la base de loisirs (Tournefeuille). La baignade
   n'y est pas décrite comme une piscine municipale. À clarifier.

## Le setup

- **GitHub Action qui vérifie avant de déployer** : elle protégerait aussi les envois de la tâche
  cloud, pas seulement ceux du PC. Mais il faut passer GitHub Pages en « déploiement par Actions »,
  ce qui touche au compte. À faire quand l'appli sera publique. `publish.mjs` pourra alors être
  retiré.
- **Lecture automatique des horaires** : transformer le texte des fiches en données (`schedules`).
  Tentant, mais le format change d'une fiche à l'autre (« Du lundi au vendredi », « Lundi :
  12h - 14h / 16h -21h », avec des notes au milieu). Aujourd'hui Claude lit l'écart et corrige, ce
  qui est plus sûr. À reconsidérer quand les créneaux multiples seront gérés.
- **Collecte depuis le cloud** : si un jour le cloud peut lire le site de la Mairie, la
  comparaison pourrait tourner dans la tâche planifiée. Il suffira d'ajouter une source dans
  `tools/sources/` : la comparaison reste la même.
- **Tâche planifiée sur le PC** : lancer `compare` chaque semaine automatiquement. Seulement si
  l'oubli de la lancer devient un vrai problème.
- **Compteur dans le MOTEUR** : faire calculer le compteur du haut par le `MOTEUR`, pour que
  `check` le couvre aussi (voir « Limite connue » dans CONSTRUCTION.md).

## Présenter l'appli à la Métropole (moyen terme)

Objectif : que les horaires deviennent une donnée publique, et que SPool soit une réutilisation
reconnue.

1. **D'abord un mois de données justes.** Il se prouve par l'historique git de `sources/mairie/`
   (chaque validation est datée) et par `check` resté au vert.
2. **Déclarer SPool comme réutilisation** sur le portail open data de Toulouse Métropole et sur
   data.gouv.fr (jeu de données des équipements sportifs / piscines).
3. **Proposer à l'équipe open data de publier les horaires** en données ouvertes. Alors
   `tools/sources/opendata.mjs` remplacerait la lecture des fiches.
4. **Jamais de logo ni d'apparence officielle.** Mention visible : « application indépendante,
   source : sites de la Mairie ». Présente dans l'appli depuis la v4 (sous-titre et
   « À propos »).

## Mobile

- Application native pour les stores (par ex. avec Capacitor, qui envelopperait ce même
  `index.html`) : ni faite ni essayée. Pas nécessaire tant que l'appli installée depuis le
  navigateur (PWA) suffit.
