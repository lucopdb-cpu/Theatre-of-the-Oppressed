// Arsenaal van de Joker — lijst van bestanden voor de app (offline gebruik)
//
// Wat het doet:
//   Maakt app-bestanden.json in de hoofdmap: alle bestanden die de app nodig heeft om de hele site
//   zonder internet te laten werken (pagina's, scripts, afbeeldingen, iconen en de zoekindex),
//   elk met een korte vingerafdruk van de inhoud. De service worker (sw.js) leest die lijst en haalt
//   alleen op wat nieuw of veranderd is, en ruimt op wat niet meer op de site staat.
//
// Draaien (vanuit de hoofdmap van de site, geen extra pakketten nodig):
//   node hulpmiddelen/appbestanden.mjs
// Op GitHub gebeurt dit vanzelf bij elke wijziging, na het bouwen van de zoekindex
// (zie .github/workflows/zoekindex.yml). Een nieuwe pagina hoeft dus nergens met de hand bij.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UIT = path.join(ROOT, 'app-bestanden.json');

// Wat mee moet
const SOORTEN = /\.(html|js|css|json|webmanifest|svg|png|jpg|jpeg|webp|gif|ico|woff2?|pf_meta|pf_fragment|pf_index|pf_filter|pagefind)$/i;
// Wat niet mee hoeft (werkbestanden, de service worker zelf, deze lijst zelf)
const NIET_MAPPEN = new Set(['.git', '.github', 'hulpmiddelen', 'node_modules']);
const NIET_BESTANDEN = new Set(['sw.js', 'app-bestanden.json', 'package.json', 'package-lock.json']);

function lopen(dir, prefix, lijst) {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    if (d.name.startsWith('.')) continue;
    const rel = prefix + d.name;
    if (d.isDirectory()) {
      if (!NIET_MAPPEN.has(d.name)) lopen(path.join(dir, d.name), rel + '/', lijst);
    } else if (SOORTEN.test(d.name) && !NIET_BESTANDEN.has(rel)) {
      lijst.push(rel);
    }
  }
  return lijst;
}

const namen = lopen(ROOT, '', []).sort();
const bestanden = {};
let grootte = 0;
const totaal = crypto.createHash('sha1');
for (const n of namen) {
  const inhoud = fs.readFileSync(path.join(ROOT, n));
  const vinger = crypto.createHash('sha1').update(inhoud).digest('hex').slice(0, 10);
  bestanden[n] = vinger;
  grootte += inhoud.length;
  totaal.update(n + ':' + vinger + '\n');
}

const uit = {
  versie: totaal.digest('hex').slice(0, 12),
  aantal: namen.length,
  grootte,
  bestanden
};
fs.writeFileSync(UIT, JSON.stringify(uit, null, 0) + '\n');
console.log(`app-bestanden.json: ${namen.length} bestanden, ${(grootte / 1048576).toFixed(1)} MB, versie ${uit.versie}`);
