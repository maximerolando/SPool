/* Service worker — v4. Vérifié par tools/sw-test.mjs.
   - Seuls les fichiers de CE site vont en cache. Les tuiles de carte et tout autre site passent
     directement par le navigateur (sinon une image de refus du fournisseur resterait figée).
   - Installation : fichiers téléchargés en contournant le cache du navigateur ({cache:"reload"}) ;
     sinon l'ancienne page, gardée 10 min par GitHub Pages, entrerait dans le nouveau cache.
   - data.json : réseau d'abord, UNE seule copie de secours (sans le ?t=… de l'actualisation).
   - Le reste : cache d'abord. Hors ligne, repli sur index.html seulement pour une ouverture de page.
   Changer le nom de CACHE à chaque modification du code de index.html (npm run publish le vérifie). */
const CACHE = "piscines-tls-v4";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./data.json",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(ASSETS.map((a) =>
        fetch(new Request(a, { cache: "reload" })).then((r) => { if (!r.ok) throw new Error(a); return c.put(a, r); }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // autre site : pas de cache ici
  if (url.pathname.endsWith("/data.json")) {
    e.respondWith(
      fetch(e.request).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put("./data.json", copy)).catch(() => {}); }
        return res;
      }).catch(() => caches.match("./data.json"))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((hit) =>
      hit ||
      fetch(e.request).then((res) => {
        if (res.ok && !url.search) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {}); }
        return res;
      }).catch(() => (e.request.mode === "navigate" ? caches.match("./index.html") : Response.error()))
    )
  );
});
