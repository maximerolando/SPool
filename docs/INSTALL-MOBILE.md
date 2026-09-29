# 📱 Installer « Piscines de Toulouse » sur mobile

Le site s'installe comme une app (PWA), sur Android **et** iOS, sans store, en 30 s.
(Une app native pour les stores n'est pas faite ni essayée : c'est une idée, voir
[`IDEES.md`](IDEES.md).)

---

## « Ajouter à l'écran d'accueil »

**Pré-requis** : le site doit être servi en **HTTPS**. Le plus simple = GitHub Pages.

### 1. Publier le site (une seule fois)
1. Sur GitHub : dépôt → **Settings → Pages**.
2. *Build and deployment* → *Source* : **Deploy from a branch**.
3. Branche : `claude/toulouse-pools-dashboard-31xhxb`, dossier `/ (root)` → **Save**.
4. Au bout d'1–2 min, l'URL apparaît : `https://maximerolando.github.io/SPool/`
   (majuscules comprises : `/spool/` donne une erreur 404).

### 2. Installer sur **Android** (Chrome)
1. Ouvre l'URL dans **Chrome**.
2. Menu **⋮** (en haut à droite) → **Installer l'application** (ou *Ajouter à l'écran
   d'accueil*).
3. Confirme → l'icône 🏊 apparaît sur l'écran d'accueil, l'app s'ouvre **en plein écran**
   (sans barre d'adresse) et fonctionne **hors-ligne**.

### 3. Installer sur **iOS / iPadOS** (Safari)
1. Ouvre l'URL dans **Safari** (obligatoire, pas Chrome iOS).
2. Bouton **Partager** (carré avec flèche) → **Sur l'écran d'accueil**.
3. **Ajouter** → l'icône apparaît, l'app s'ouvre en plein écran.

> La carte a besoin d'Internet pour ses fonds de plan ; le reste (horaires, statut,
> fiches) marche hors-ligne grâce au service worker.

---

## Mettre à jour l'app après une modif
Rien à faire sur le téléphone : la nouvelle version s'affiche au plus tard à la 2ᵉ
ouverture en ligne (vérifié par `tools/sw-test.mjs`). Côté dépôt, `npm run publish` refuse
une modification du code sans nouveau nom de cache dans `sw.js`.

## Aide-mémoire des chemins
```
index.html                     → toute l'app
manifest.webmanifest           → nom, couleurs, icônes (PWA)
sw.js                          → cache hors-ligne (PWA)
icons/icon-512.png             → icône source
```
