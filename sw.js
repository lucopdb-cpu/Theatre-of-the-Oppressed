/* Arsenaal van de Joker — service worker (de app en offline gebruik)
 *
 * Wordt aangemeld door app.js (dat thema.js op elke pagina laadt). Een pagina hoeft hier niets voor te doen.
 *
 * - Pagina's (.html) en de lijsten (.json): eerst het netwerk, zodat je altijd de nieuwste versie ziet.
 *   Duurt dat langer dan een paar seconden of is er geen verbinding, dan de opgeslagen versie.
 * - Al het andere (scripts, afbeeldingen, zoekindex): meteen uit de opslag als het er is,
 *   en op de achtergrond bijwerken.
 * - Lettertypen van Google worden apart bewaard, zodat de site offline er hetzelfde uitziet.
 * - "Alles opslaan": op verzoek van een pagina (bericht {type:'opslaan'}) haalt de service worker
 *   app-bestanden.json op en zet de hele site op het toestel. Daarna alleen wat nieuw of veranderd is.
 *   app.js vraagt dat vanzelf als het Arsenaal als app geopend wordt; op app.html kan het ook met een knop.
 *   Voortgang gaat als bericht {type:'voortgang', klaar, totaal} naar de open pagina's,
 *   aan het eind {type:'opgeslagen', ...}.
 *
 * Wijzig je dit bestand, verhoog dan VERSIE: dan haalt elk toestel de nieuwe service worker op.
 * Voor nieuwe of gewijzigde pagina's hoeft dat niet; die komen via het netwerk en app-bestanden.json.
 */
'use strict';

const VERSIE = 1;
const OPSLAG = 'arsenaal-site';
const LETTERS = 'arsenaal-letters';
const LIJST = 'app-bestanden.json';
const BASIS = new URL('./', self.location).href;          // https://…/Theatre-of-the-Oppressed/
const META = BASIS + '__opgeslagen.json';                  // wat er op het toestel staat (alleen in de opslag)
const WACHTTIJD = 3500;                                    // ms voordat we de opgeslagen pagina tonen

// Het minimum, meteen bij de eerste keer: daarmee werkt de startpagina en het TO Arsenaal al offline
const START = [
  'index.html', 'to-arsenaal.html', 'app.html', 'en/index.html', 'en/to-arsenaal.html', 'en/app.html',
  'thema.js', 'zoeken.js', 'hoofdstukken.js', 'sessie.js', 'nav.js', 'app.js',
  'favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'app-icoon-192.png',
  'manifest.webmanifest', 'en/manifest.webmanifest', 'joker-amber.png', 'joker-donker.png', 'joker-goud.png'
];

// ── hulpjes ────────────────────────────────────────────────

// Eén sleutel per bestand: zonder ?… en #…, en een map wordt index.html
function sleutel(url) {
  const u = new URL(url);
  u.search = ''; u.hash = '';
  if (u.pathname.endsWith('/')) u.pathname += 'index.html';
  return u.href;
}

// Een doorgestuurd antwoord mag niet als antwoord op een navigatie terug; maak er een gewoon antwoord van
async function schoon(r) {
  if (!r.redirected) return r;
  const body = await r.blob();
  return new Response(body, { status: r.status, statusText: r.statusText, headers: r.headers });
}

function wacht(ms) { return new Promise(res => setTimeout(res, ms)); }

async function melden(bericht) {
  const lijst = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  lijst.forEach(c => c.postMessage(bericht));
}

function offlinePagina(url) {
  const en = /\/en\//.test(url);
  const t = en
    ? ['Offline', 'This page is not on this device yet', 'You are offline and this page has not been saved. Go back, or open the home page: what has been saved still works.', 'Home page', 'index.html']
    : ['Offline', 'Deze pagina staat nog niet op dit toestel', 'Je bent offline en deze pagina is nog niet opgeslagen. Ga terug, of open de startpagina: wat al is opgeslagen, werkt gewoon.', 'Startpagina', 'index.html'];
  const html = `<!DOCTYPE html><html lang="${en ? 'en' : 'nl'}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${t[0]}</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f2efe9;color:#2a2824;font-family:Georgia,serif;padding:24px}
main{max-width:440px}h1{font-weight:400;font-size:24px;margin:0 0 12px}p{line-height:1.6;color:#52504a}
a{display:inline-block;margin-top:8px;padding:8px 16px;border-radius:999px;background:#1a1418;color:#f2efe9;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px}
@media (prefers-color-scheme:dark){body{background:#1a1713;color:#e6dfd2}p{color:#c0beb7}a{background:#d3a06d;color:#1a1713}}</style></head>
<body><main><h1>${t[1]}</h1><p>${t[2]}</p><a href="${BASIS}${en ? 'en/' : ''}${t[4]}">${t[3]}</a></main></body></html>`;
  return new Response(html, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// ── installeren en opruimen ───────────────────────────────

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil((async () => {
    const opslag = await caches.open(OPSLAG);
    await Promise.all(START.map(async p => {
      try {
        const r = await fetch(BASIS + p, { cache: 'no-cache' });
        if (r.ok) await opslag.put(sleutel(BASIS + p), await schoon(r));
      } catch (err) { /* ontbreekt er één, dan komt die later */ }
    }));
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const namen = await caches.keys();
    await Promise.all(namen.filter(n => n.startsWith('arsenaal-') && n !== OPSLAG && n !== LETTERS).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

// ── verzoeken ─────────────────────────────────────────────

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    e.respondWith(letters(req));
    return;
  }
  if (!req.url.startsWith(BASIS)) return;                 // tellers en andere sites: niet aankomen
  if (url.pathname.endsWith('/sw.js')) return;

  const pagina = req.mode === 'navigate' || /\.html$|\/$/.test(url.pathname);
  const vers = pagina || /\.(json|webmanifest)$/.test(url.pathname) || /\/pagefind\/pagefind\.js$/.test(url.pathname);
  e.respondWith(vers ? netwerkEerst(req, sleutel(req.url), pagina) : opslagEerst(req, sleutel(req.url)));
});

async function netwerkEerst(req, key, pagina) {
  const opslag = await caches.open(OPSLAG);
  const net = fetch(req).then(async r => {
    if (r.ok && r.type === 'basic') await opslag.put(key, await schoon(r.clone()));
    return r;
  });
  net.catch(() => {});
  try {
    const r = await Promise.race([net, wacht(WACHTTIJD)]);
    if (r) return pagina ? schoon(r) : r;
    const bewaard = await opslag.match(key);                // het netwerk is traag: toon wat er is
    if (bewaard) return bewaard;
    return pagina ? schoon(await net) : await net;
  } catch (err) {
    const bewaard = await opslag.match(key);
    if (bewaard) return bewaard;
    if (pagina) return offlinePagina(req.url);
    return Response.error();
  }
}

async function opslagEerst(req, key) {
  const opslag = await caches.open(OPSLAG);
  const bewaard = await opslag.match(key);
  const net = fetch(req).then(async r => {
    if (r.ok && r.type === 'basic') await opslag.put(key, r.clone());
    return r;
  });
  if (bewaard) { net.catch(() => {}); return bewaard; }
  try { return await net; } catch (err) { return Response.error(); }
}

async function letters(req) {
  const opslag = await caches.open(LETTERS);
  const bewaard = await opslag.match(req);
  const net = fetch(req).then(r => {
    if (r.ok || r.type === 'opaque') opslag.put(req, r.clone());
    return r;
  });
  if (bewaard) { net.catch(() => {}); return bewaard; }
  try { return await net; } catch (err) { return Response.error(); }
}

// ── alles opslaan ─────────────────────────────────────────

let bezig = null;

async function opgeslagen() {
  const opslag = await caches.open(OPSLAG);
  const r = await opslag.match(META);
  if (!r) return null;
  try { return await r.json(); } catch (err) { return null; }
}

async function allesOpslaan() {
  const opslag = await caches.open(OPSLAG);
  const r = await fetch(BASIS + LIJST, { cache: 'no-store' });
  if (!r.ok) throw new Error('lijst niet gevonden');
  const lijst = await r.json();
  const oud = (await opgeslagen()) || { bestanden: {} };

  const aanwezig = new Set((await opslag.keys()).map(q => q.url));
  const namen = Object.keys(lijst.bestanden);
  const nodig = namen.filter(n => oud.bestanden[n] !== lijst.bestanden[n] || !aanwezig.has(sleutel(BASIS + n)));
  const nieuw = Object.assign({}, oud.bestanden);
  let klaar = 0, mislukt = 0, laatst = 0;

  await melden({ type: 'voortgang', klaar: 0, totaal: nodig.length });
  let i = 0;
  async function werker() {
    while (i < nodig.length) {
      const n = nodig[i++];
      try {
        const a = await fetch(BASIS + n, { cache: 'no-cache' });
        if (a.ok) { await opslag.put(sleutel(BASIS + n), await schoon(a)); nieuw[n] = lijst.bestanden[n]; }
        else mislukt++;
      } catch (err) { mislukt++; }
      klaar++;
      const nu = Date.now();
      if (nu - laatst > 250) { laatst = nu; melden({ type: 'voortgang', klaar, totaal: nodig.length }); }
    }
  }
  await Promise.all(Array.from({ length: 8 }, werker));

  // Opruimen wat niet meer op de site staat (bijvoorbeeld oude stukken van de zoekindex)
  const blijft = new Set(namen.map(n => sleutel(BASIS + n)));
  blijft.add(META);
  for (const q of await opslag.keys()) {
    if (q.url.startsWith(BASIS) && !blijft.has(q.url)) { await opslag.delete(q); delete nieuw[q.url.slice(BASIS.length)]; }
  }
  for (const n of Object.keys(nieuw)) if (!(n in lijst.bestanden)) delete nieuw[n];

  const stand = {
    versie: mislukt ? null : lijst.versie,
    datum: new Date().toISOString(),
    aantal: Object.keys(nieuw).length,
    totaal: namen.length,
    grootte: lijst.grootte,
    bestanden: nieuw
  };
  await opslag.put(META, new Response(JSON.stringify(stand), { headers: { 'Content-Type': 'application/json' } }));
  return { type: 'opgeslagen', versie: stand.versie, datum: stand.datum, aantal: stand.aantal, totaal: stand.totaal, grootte: stand.grootte, mislukt, opgehaald: nodig.length - mislukt };
}

async function stand() {
  const s = await opgeslagen();
  return s
    ? { type: 'stand', versie: s.versie, datum: s.datum, aantal: s.aantal, totaal: s.totaal, grootte: s.grootte, bezig: !!bezig }
    : { type: 'stand', versie: null, aantal: 0, bezig: !!bezig };
}

self.addEventListener('message', e => {
  const soort = e.data && e.data.type;
  if (soort === 'opslaan') {
    if (!bezig) {
      bezig = allesOpslaan()
        .then(uit => melden(uit))
        .catch(err => melden({ type: 'fout', bericht: String(err && err.message || err) }))
        .finally(() => { bezig = null; });
    }
    e.waitUntil(bezig);
  } else if (soort === 'stand') {
    e.waitUntil(stand().then(s => e.source && e.source.postMessage(s)));
  }
});
