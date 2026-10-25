// Arsenaal van de Joker — zoekindex bouwen met Pagefind
//
// Wat het doet:
//   Opent elke pagina van de site in een browser (zonder venster), leest elke oefening uit het
//   TO Arsenaal, elke kaart van de kaartpagina's, elke vermelding in de bronnenlijst en de inleiding
//   van elke pagina, en maakt daar een zoekindex van in de map pagefind/ (één index per taal).
//   Elke kaart en oefening wordt een eigen zoekresultaat met een eigen adres:
//     to-arsenaal.html#oefening=<naam>, forum.html#kaart=<titel>, bronnen.html#<id>
//
// Talen: de taal komt uit <html lang="…"> van elke pagina. Pagina's in de hoofdmap en in mappen met
// een taalcode van twee letters (en/, later bijvoorbeeld fr/ of es/) worden meegenomen. Een nieuwe
// taal krijgt vanzelf een eigen index; zoeken.js kiest op elke pagina de index van die taal.
//
// Draaien (vanuit de hoofdmap van de site):
//   npm install --no-save pagefind@1.5.2 playwright
//   npx playwright install chromium
//   node hulpmiddelen/zoekindex.mjs
// Op GitHub gebeurt dit vanzelf bij elke wijziging (zie .github/workflows/zoekindex.yml).

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import * as pagefind from 'pagefind';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UIT = path.join(ROOT, 'pagefind');

// ── pagina's zoeken ─────────────────────────────────────────
function paginas() {
  const lijst = [];
  const map = (dir, prefix) => fs.readdirSync(dir).filter(f => f.endsWith('.html')).sort().forEach(f => lijst.push(prefix + f));
  map(ROOT, '');
  fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^[a-z]{2}$/.test(d.name))
    .forEach(d => map(path.join(ROOT, d.name), d.name + '/'));
  return lijst.filter(p => {
    const s = fs.readFileSync(path.join(ROOT, p), 'utf8');
    return !/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(s);
  });
}

// ── kleine webserver voor de hoofdmap ───────────────────────
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json' };
function server() {
  return new Promise(res => {
    const s = http.createServer((req, rsp) => {
      const p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
      const f = path.join(ROOT, p.endsWith('/') ? p + 'index.html' : p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; }
      rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(rsp);
    });
    s.listen(0, '127.0.0.1', () => res(s));
  });
}

// ── uitlezen, in de pagina zelf ─────────────────────────────
// Geeft een lijst records terug: { url, titel, tekst, soort }
async function leesPagina() {
  const pagina = location.pathname.split('/').pop() || 'index.html';
  const INLINE = new Set(['EM', 'I', 'B', 'STRONG', 'A', 'MARK', 'SUP', 'SUB', 'SMALL', 'ABBR', 'CODE', 'Q', 'CITE', 'U', 'S']);
  const WEG = 'script,style,svg,noscript,.sessie-knop,.sessie-link,.acc-arrow,.acc-expand-all,.card-add-btn,.thema-knop,.taal-knop,.zoek-knop,.arsenaal-nav,.arsenaal-footer,footer,.kbd-row,[data-zoek-negeer]';
  const kort = el => (el && el.textContent || '').replace(/\s+/g, ' ').trim();
  // Op een kaart: titel, nummering en labels weg (de titel staat al als kop in de index);
  // kenmerken als fase, niveau, duur en trefwoorden achteraan, zodat het uittreksel met de tekst zelf begint
  const KAART_WEG = '.card-name,.tech-num,.acc-sn,.step-num,.step-nr,.inner-marker,.badge-num,.stages-lbl,.stages-head,.section-lbl,.tip-lbl,.meta-lbl';
  const ACHTERAAN = '.card-badges,.head-badges,.card-cat,.card-type,.card-meta,.meta-bar,.card-meta-row,.card-tags,.tag-row';
  function tekstVan(c) {
    c.querySelectorAll('*').forEach(x => { if (!INLINE.has(x.tagName)) x.append(' '); });
    return c.textContent.replace(/\s+/g, ' ').trim();
  }
  function plat(el, kaart) {
    if (!el) return '';
    const c = el.cloneNode(true);
    c.querySelectorAll(WEG).forEach(x => x.remove());
    if (!kaart) return tekstVan(c);
    c.querySelectorAll(KAART_WEG).forEach(x => x.remove());
    const achter = [...c.querySelectorAll(ACHTERAAN)].filter(x => !x.parentElement.closest(ACHTERAAN));
    const extra = achter.map(x => { x.remove(); return tekstVan(x); }).join(' · ');
    return (tekstVan(c) + (extra ? ' · ' + extra : '')).trim();
  }
  const adresDeel = t => encodeURIComponent(t).replace(/[()']/g, ch => '%' + ch.charCodeAt(0).toString(16).toUpperCase());

  const kopEl = document.querySelector('.app-name') || document.querySelector('h1');
  const onderdeel = kort(kopEl) || document.title.split(' — ')[0];
  const records = [];
  const kop = document.querySelector('.masthead') || document.querySelector('header');

  // 1. TO Arsenaal: elke oefening
  if (typeof D !== 'undefined' && typeof toonOefening === 'function') {
    records.push({ url: pagina, titel: onderdeel, tekst: plat(kop), soort: 'pagina' });
    const namen = D.map(o => o.n);
    for (const naam of namen) {
      toonOefening(naam);
      const kaart = document.querySelector('#kw .card');
      if (!kaart) continue;
      records.push({ url: pagina + '#oefening=' + adresDeel(naam), titel: kort(kaart.querySelector('.card-name')) || naam, tekst: plat(kaart, true), soort: 'oefening' });
    }
    return { onderdeel, records };
  }

  // 2. Kaartpagina's: blader door alle kaarten, zoals de link #kaart=<titel> dat ook doet
  if (typeof nextTech === 'function' && typeof prevTech === 'function' && document.querySelector('.card .card-name')) {
    records.push({ url: pagina, titel: onderdeel, tekst: plat(kop), soort: 'pagina' });
    const stap = document.querySelector('.view-toggle .vt-btn[data-view="step"]');
    if (stap && !stap.classList.contains('on')) stap.click();
    const kaart = () => document.querySelector('.card');
    let vorige = null, n = 0;
    while (plat(kaart()) !== vorige && n++ < 2000) { vorige = plat(kaart()); prevTech(); }
    vorige = null; n = 0;
    while (n++ < 2000) {
      const k = kaart(), alles = plat(k);
      if (alles === vorige) break;
      vorige = alles;
      const titel = kort(k.querySelector('.card-name')), tekst = plat(k, true);
      records.push({ url: pagina + '#kaart=' + adresDeel(titel), titel, tekst, soort: 'kaart' });
      nextTech();
    }
    return { onderdeel, records };
  }

  // 3. Bronnenlijst: elke vermelding met een id
  const refs = document.querySelectorAll('.ref[id]');
  if (refs.length) {
    records.push({ url: pagina, titel: onderdeel, tekst: plat(kop), soort: 'pagina' });
    refs.forEach(r => {
      const tekst = plat(r);
      const m = tekst.match(/^(.{1,140}?\((?:[^()]*\d{4}[a-z]?|z\.d\.|n\.d\.)[^()]*\))/);
      records.push({ url: pagina + '#' + r.id, titel: m ? m[1] : tekst.slice(0, 80), tekst, soort: 'bron' });
    });
    return { onderdeel, records };
  }

  // 4. Andere pagina's (startpagina, overzichten): de hele pagina als één resultaat
  const romp = document.querySelector('.container, .page, main') || document.body;
  records.push({ url: pagina, titel: onderdeel, tekst: plat(romp), soort: 'pagina' });
  return { onderdeel, records };
}

// ── hoofdprogramma ──────────────────────────────────────────
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const srv = await server();
const basis = `http://127.0.0.1:${srv.address().port}/`;
const browser = await chromium.launch();
const ctx = await browser.newContext();
// Geen bezoekersteller en geen lettertypes van buiten tijdens het bouwen
await ctx.route(/goatcounter|gc\.zgo\.at|fonts\.googleapis|fonts\.gstatic/, r => r.abort());

const { index, errors } = await pagefind.createIndex({});
if (errors.length) throw new Error(errors.join('\n'));

const telling = {};
const fouten = [];
const verzameld = [];   // eerst alles uitlezen, dan pas indexeren (de lijst van talen moet compleet zijn)
for (const p of paginas()) {
  const page = await ctx.newPage();
  page.on('pageerror', e => fouten.push(`${p}: ${e.message}`));
  await page.goto(basis + p, { waitUntil: 'load' });
  const taal = ((await page.evaluate(() => document.documentElement.lang)) || 'nl').toLowerCase().slice(0, 2);
  const { onderdeel, records } = await page.evaluate(leesPagina);
  // In welke talen bestaat deze pagina (eigen taal plus de vertalingen die de pagina aankondigt)
  const talen = [...new Set([taal, ...(await page.evaluate(() =>
    [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(l => (l.getAttribute('hreflang') || '').toLowerCase().slice(0, 2))))])].filter(Boolean);
  await page.close();
  verzameld.push({ p, taal, talen, onderdeel, records });
  console.log(`${p.padEnd(26)} ${taal}  ${String(records.length).padStart(4)}  ${onderdeel}`);
}
const alleTalen = [...new Set(verzameld.map(v => v.taal))].sort();

for (const { p, taal, talen, onderdeel, records } of verzameld) {
  // Filter 'ontbreekt': de talen waarin deze pagina (nog) niet bestaat. Zoeken in een andere taal neemt
  // uit deze index alleen de resultaten mee die in die taal ontbreken.
  const ontbreekt = alleTalen.filter(t => !talen.includes(t));
  const map = p.includes('/') ? p.split('/')[0] + '/' : '';
  const gezien = new Set();
  for (const r of records) {
    const url = map + r.url;
    if (!r.tekst || gezien.has(url)) { if (gezien.has(url)) fouten.push(`${p}: dubbel adres ${url}`); continue; }
    gezien.add(url);
    // Eén klein HTML-document per resultaat: de titel als kop (telt zwaarder bij het zoeken)
    const html = `<!doctype html><html lang="${taal}"><head><meta charset="utf-8"><title>${esc(r.titel)}</title></head><body>` +
      `<h1>${esc(r.titel)}</h1><p>${esc(r.tekst)}</p>` +
      `<span data-pagefind-meta="onderdeel" data-pagefind-ignore>${esc(onderdeel)}</span>` +
      `<span data-pagefind-meta="soort" data-pagefind-ignore>${r.soort}</span>` +
      `<span data-pagefind-meta="taal" data-pagefind-ignore>${taal}</span>` +
      `<span data-pagefind-filter="onderdeel" data-pagefind-ignore>${esc(onderdeel)}</span>` +
      ontbreekt.map(t => `<span data-pagefind-filter="ontbreekt" data-pagefind-ignore>${t}</span>`).join('') +
      `</body></html>`;
    const res = await index.addHTMLFile({ url, content: html });
    if (res.errors && res.errors.length) fouten.push(`${url}: ${res.errors.join('; ')}`);
    telling[taal] = (telling[taal] || 0) + 1;
  }
}

await browser.close();
srv.close();

fs.rmSync(UIT, { recursive: true, force: true });
const w = await index.writeFiles({ outputPath: UIT });
if (w.errors && w.errors.length) throw new Error(w.errors.join('\n'));
await pagefind.close();

console.log('\nResultaten per taal:', telling);
if (fouten.length) { console.log('\nOpmerkingen:'); fouten.forEach(f => console.log('  ' + f)); }
