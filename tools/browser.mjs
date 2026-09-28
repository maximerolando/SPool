/* Lance Chromium pour les scripts de rendu, sans chemin propre à une machine.
   Ordre : $CHROME_PATH → navigateur installé par Playwright (npx playwright-core install chromium)
   → Google Chrome du système. */
import { chromium } from "playwright-core";

export async function launch() {
  if (process.env.CHROME_PATH) return chromium.launch({ executablePath: process.env.CHROME_PATH });
  try { return await chromium.launch(); }
  catch { return chromium.launch({ channel: "chrome" }); }
}
