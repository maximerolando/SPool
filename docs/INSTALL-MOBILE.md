# 📱 Installer « Piscines de Toulouse » sur mobile

Deux façons, de la plus rapide à la plus « app native » :

- **A. PWA** — installer le site comme une app (Android **et** iOS), sans store, en 30 s.
- **B. App native (Capacitor)** — un vrai `.apk` Android (puis app iOS), même code.

---

## A. PWA — « Ajouter à l'écran d'accueil » (recommandé pour commencer)

**Pré-requis** : le site doit être servi en **HTTPS**. Le plus simple = GitHub Pages.

### 1. Publier le site (une seule fois)
1. Sur GitHub : dépôt → **Settings → Pages**.
2. *Build and deployment* → *Source* : **Deploy from a branch**.
3. Branche : `claude/toulouse-pools-dashboard-31xhxb`, dossier `/ (root)` → **Save**.
4. Au bout d'1–2 min, l'URL apparaît :
   `https://maximerolando.github.io/spool/` (ou selon le nom du dépôt).

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

## B. App native Android (Capacitor) → `.apk` / Play Store

Capacitor **enveloppe** `index.html` dans une app native : un seul code à maintenir,
et iOS s'ajoute ensuite d'une commande.

### Pré-requis (poste de dev)
- **Node.js 18+**
- **Android Studio** + un **JDK 17** (installé avec Android Studio)
- Variables d'env `ANDROID_HOME` (SDK) configurées par Android Studio.

### 1. Initialiser Capacitor (à la racine du dépôt)
```bash
npm init -y
npm i @capacitor/core
npm i -D @capacitor/cli
npx cap init "Piscines TLS" fr.toulouse.piscines --web-dir=.
```
`--web-dir=.` indique que `index.html` est à la racine (rien à builder).

### 2. Ajouter la plateforme Android
```bash
npm i @capacitor/android
npx cap add android
npx cap sync
```

### 3. Ouvrir, tester, générer l'APK
```bash
npx cap open android          # ouvre le projet dans Android Studio
```
Dans Android Studio :
- **Run ▶** sur un émulateur ou un téléphone branché (mode développeur + débogage USB) ;
- APK de test : **Build → Build Bundle(s) / APK(s) → Build APK(s)** →
  `android/app/build/outputs/apk/debug/app-debug.apk` (installable directement).

### 4. Publier sur le Play Store (optionnel)
- Générer un **App Bundle signé** : *Build → Generate Signed Bundle / APK → Android App
  Bundle*, crée une **keystore** (garde-la précieusement).
- Compte **Google Play Console** (25 $ une fois) → créer l'app → déposer le `.aab`.

### Icône & écran de démarrage
Réutilise `icons/icon-512.png` (et `icon-maskable-512.png`). Pour générer tous les
formats automatiquement :
```bash
npm i -D @capacitor/assets
npx @capacitor/assets generate --iconBackgroundColor '#0e93ab' --android
```

---

## C. App iOS native (plus tard) — Capacitor aussi

**Pré-requis** : un **Mac** avec **Xcode**, et un compte **Apple Developer** (99 $/an)
pour publier sur l'App Store.

```bash
npm i @capacitor/ios
npx cap add ios
npx cap sync
npx cap open ios              # ouvre le projet dans Xcode
```
Dans Xcode : choisir l'équipe de signature (*Signing & Capabilities*), **Run ▶** sur un
iPhone branché, puis *Product → Archive* pour envoyer sur **App Store Connect**.

---

## Mettre à jour l'app après une modif
- **PWA** : rien à faire — au prochain lancement en ligne, le service worker récupère la
  nouvelle version (`sw.js`, bump du numéro de cache si besoin).
- **Capacitor** : `npx cap sync` puis rebuild dans Android Studio / Xcode.

## Aide-mémoire des chemins
```
index.html                     → toute l'app
manifest.webmanifest           → nom, couleurs, icônes (PWA)
sw.js                          → cache hors-ligne (PWA)
icons/icon-512.png             → icône source (Capacitor + PWA)
```
