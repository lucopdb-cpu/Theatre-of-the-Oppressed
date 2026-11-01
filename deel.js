/* Arsenaal van de Joker — werken met een groep: het scherm blijft aan, en een kaart of oefening doorsturen
 *
 * Wordt vanzelf geladen door thema.js (dat op elke pagina staat); een pagina hoeft hier niets voor te doen.
 *
 * 1. Scherm blijft aan
 *    Op pagina's met kaarten of oefeningen (alles met een .card, zoals het TO Arsenaal, de methodieken en de atlas)
 *    vraagt dit script het toestel om het scherm niet op zwart te laten gaan zolang de pagina openstaat en in beeld is
 *    (Screen Wake Lock). Ga je naar een andere app of vergrendel je zelf, dan vervalt dat vanzelf; kom je terug,
 *    dan vraagt het script het opnieuw. Kan het toestel het niet, dan gebeurt er gewoon niets.
 *
 * 3. Verder waar je was
 *    Elke pagina (behalve de startpagina) onthoudt op dit toestel dat je er was, en op kaartpagina's en in het
 *    TO Arsenaal ook welke kaart of oefening je het laatst bekeek (pas nadat je zelf iets aanklikt of bladert).
 *    De startpagina toont de laatste vier, in het blok #laatst ("Verder waar je was"). Opslag: localStorage
 *    'arsenaal-laatst', alleen in deze browser; Nederlandse en Engelse pagina's apart getoond.
 *
 * 2. Doorsturen
 *    - Op kaartpagina's: een knop "Delen" bij elke kaart (naast "+ selectie"). Het adres is pagina.html#kaart=<titel>;
 *      wie het opent, komt op die kaart uit (dat regelen sessie.js en zoeken.js).
 *    - In het TO Arsenaal: een knop "Delen" naast "+ Mijn selectie". Het adres is to-arsenaal.html#oefening=<naam>.
 *    De knop opent het deelmenu van het toestel (WhatsApp, mail, berichten…). Heeft de browser dat niet,
 *    dan wordt de link gekopieerd.
 */
(function () {
  'use strict';
  var ENGELS = /^en/i.test(document.documentElement.getAttribute('lang') || '');
  var eigen = document.currentScript && document.currentScript.src;
  var SITE = eigen ? eigen.replace(/deel\.js(?:[?#].*)?$/, '') : new URL('./', location.href).href;
  var T = ENGELS
    ? { deel: 'Share', titel: 'Share this card', gekopieerd: 'Link copied', site: "A Joker's Arsenal", vergeet: 'Forget this list' }
    : { deel: 'Delen', titel: 'Deze kaart doorsturen', gekopieerd: 'Link gekopieerd', site: 'Arsenaal van de Joker', vergeet: 'Vergeet deze lijst' };

  var PIJL = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2v8.5M5 5l3-3 3 3M5.5 7.5H4a1 1 0 0 0-1 1V13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8.5a1 1 0 0 0-1-1h-1.5"/></svg>';

  var CSS = [
    /* knop op kaartpagina's, in dezelfde vorm als "+ selectie" van sessie.js */
    '.deel-knop{flex-shrink:0;align-self:flex-start;display:inline-flex;align-items:center;gap:5px;font-family:var(--mono,"JetBrains Mono",monospace);font-size:10px;line-height:1.4;padding:3px 9px;border-radius:20px;border:1px solid var(--paper4,#ddd4c4);background:var(--paper2,#f2ede4);color:var(--ink3,#9a9790);cursor:pointer;transition:background .12s,border-color .12s,color .12s;white-space:nowrap}',
    '.deel-knop:hover{border-color:var(--ink3,#9a9790);color:var(--ink,#1a1814)}',
    '.deel-knop:focus-visible{outline:2px solid #8c5e2a;outline-offset:2px}',
    '.head-badges .deel-knop{margin-top:6px}',
    /* TO Arsenaal: naast "+ Mijn selectie" */
    '.card-knoppen{display:flex;gap:8px;margin:0 26px 20px}',
    '.card-knoppen .card-add-btn{margin:0;width:auto;flex:1}',
    '.card-deel-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:9px 14px;border-radius:8px;border:1px solid var(--paper4,#ddd4c4);background:var(--paper2,#e9e4db);cursor:pointer;font-family:var(--sans,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);font-size:12px;font-weight:500;color:var(--ink2,#52504a);transition:all .12s;white-space:nowrap}',
    '.card-deel-btn:hover{background:var(--amber4,#f4ecdf);border-color:var(--amber3,#f0d4a8);color:var(--amber,#8c5e2a)}',
    '@media (max-width:600px){.card-knoppen{margin-left:18px;margin-right:18px}}',
    '@media print{.deel-knop,.card-deel-btn{display:none!important}}',
    /* Verder waar je was (startpagina) */
    '.laatst[hidden]{display:none}',
    '.laatst .section-header{margin-bottom:16px}',
    '.laatst-lijst{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
    '.laatst-lijst a{display:inline-flex;align-items:baseline;gap:6px;max-width:100%;padding:8px 14px;border-radius:999px;background:rgba(60,45,30,.07);color:#2a2824;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:13.5px;font-weight:500;line-height:1.3;transition:background .15s}',
    '.laatst-lijst a:hover{background:rgba(60,45,30,.13)}',
    '.laatst-lijst a span{font-weight:400;color:#7d776d;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:22ch}',
    '.laatst-vergeet{border:none;background:none;padding:4px 6px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:11.5px;color:#8b8881;text-decoration:underline;text-underline-offset:2px;cursor:pointer}',
    'html[data-thema="donker"] .laatst-lijst a{background:rgba(236,230,218,.08);color:#e6dfd2}',
    'html[data-thema="donker"] .laatst-lijst a:hover{background:rgba(236,230,218,.15)}',
    'html[data-thema="donker"] .laatst-lijst a span{color:#a7a096}',
    'html[data-thema="donker"] .laatst-vergeet{color:#96938c}',
    'html[data-thema="donker"] .deel-knop{background:#24201b;border-color:#3e372e;color:#948b7e}',
    'html[data-thema="donker"] .deel-knop:hover{border-color:#948b7e;color:#ece6da}'
  ].join('\n');

  // ── 1. scherm blijft aan ──────────────────────────────────
  var slot = null;
  function heeftKaarten() { return !!document.querySelector('.card .card-name, #kw'); }
  function vraagSlot() {
    if (!('wakeLock' in navigator) || slot || document.visibilityState !== 'visible' || !heeftKaarten()) return;
    navigator.wakeLock.request('screen').then(function (s) {
      slot = s;
      s.addEventListener('release', function () { slot = null; });
    }).catch(function () { /* niet toegestaan of niet mogelijk: niets aan de hand */ });
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') vraagSlot(); });
  // Sommige browsers willen eerst een aanraking
  document.addEventListener('pointerdown', vraagSlot, { passive: true });

  // ── 2. doorsturen ─────────────────────────────────────────
  function tekst(el) { return (el && el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function hier() { return location.href.split('#')[0]; }

  function deel(knop, naam, adres) {
    var titel = naam + ' · ' + T.site;
    if (navigator.share) {
      navigator.share({ title: titel, text: titel, url: adres }).catch(function () {});
      return;
    }
    var oud = knop.innerHTML;
    function klaar() { knop.textContent = T.gekopieerd; setTimeout(function () { knop.innerHTML = oud; }, 1800); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(adres).then(klaar, function () {});
  }

  function kaartKnoppen() {
    // Kaartpagina's
    document.querySelectorAll('.card').forEach(function (kaart) {
      if (kaart.querySelector('.deel-knop') || kaart.querySelector('#sb-kaart-btn')) return;
      var naamEl = kaart.querySelector('.card-name');
      var naam = tekst(naamEl);
      if (!naam) return;
      var plek = kaart.querySelector('.head-badges');
      if (!plek) return;
      var knop = document.createElement('button');
      knop.type = 'button';
      knop.className = 'deel-knop';
      knop.title = T.titel;
      knop.innerHTML = PIJL + T.deel;
      knop.addEventListener('click', function () {
        deel(knop, tekst(kaart.querySelector('.card-name')), hier() + '#kaart=' + encodeURIComponent(tekst(kaart.querySelector('.card-name'))));
      });
      // na "+ selectie" als die er is
      var sel = plek.querySelector('.sessie-knop');
      if (sel && sel.nextSibling) plek.insertBefore(knop, sel.nextSibling); else plek.appendChild(knop);
    });
    // TO Arsenaal
    var add = document.getElementById('sb-kaart-btn');
    if (add && !add.parentNode.classList.contains('card-knoppen')) {
      var rij = document.createElement('div');
      rij.className = 'card-knoppen';
      add.parentNode.insertBefore(rij, add);
      rij.appendChild(add);
      var knop = document.createElement('button');
      knop.type = 'button';
      knop.className = 'card-deel-btn';
      knop.title = T.titel;
      knop.innerHTML = PIJL + T.deel;
      knop.addEventListener('click', function () {
        var naam = add.dataset.naam || tekst(document.querySelector('#kw .card-name'));
        deel(knop, tekst(document.querySelector('#kw .card-name')) || naam, hier() + '#oefening=' + encodeURIComponent(naam));
      });
      rij.appendChild(knop);
    }
  }

  // ── 3. verder waar je was ─────────────────────────────────
  var LAATST = 'arsenaal-laatst';
  function leesLaatst() { try { var l = JSON.parse(localStorage.getItem(LAATST) || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; } }
  function bewaarLaatst(l) { try { localStorage.setItem(LAATST, JSON.stringify(l.slice(0, 12))); } catch (e) { /* geen opslag */ } }
  function paginaPad() {
    var u = location.href.split('#')[0].split('?')[0];
    if (u.indexOf(SITE) !== 0) return null;
    var p = u.slice(SITE.length) || 'index.html';
    if (/\/$/.test(p)) p += 'index.html';
    return /\.html$/.test(p) ? p : null;
  }
  var PAD = paginaPad();
  var START = !PAD || /^(?:[a-z]{2}\/)?index\.html$/.test(PAD) || document.querySelector('meta[http-equiv="refresh"]');
  var bezig = !!/^#(kaart|oefening)=/.test(location.hash);   // pas kaarten onthouden na een eigen handeling
  ['pointerdown', 'keydown'].forEach(function (t) { document.addEventListener(t, function () { bezig = true; setTimeout(onthoud, 50); }, { passive: true, capture: true }); });
  var vorigeKaart = null;
  function onthoud() {
    if (START) return;
    var titel = (document.title || '').split(/ — | - /)[0].trim();
    if (!titel) return;
    var kaart = null, adres = '';
    if (bezig) {
      var add = document.getElementById('sb-kaart-btn');
      if (add && add.dataset.naam) { kaart = add.dataset.naam; adres = '#oefening=' + encodeURIComponent(kaart); }
      else {
        var k = tekst(document.querySelector('.card .card-name'));
        if (k) { kaart = k; adres = '#kaart=' + encodeURIComponent(k); }
      }
    }
    var l = leesLaatst(), oud = null;
    l = l.filter(function (x) { if (x.p === PAD) { oud = x; return false; } return true; });
    if (!kaart && oud && oud.k && !bezig) { kaart = oud.k; adres = oud.h; }   // kaart van vorige keer laten staan
    if (kaart === vorigeKaart && oud && oud.k === kaart) { l.unshift(oud); bewaarLaatst(l); return; }
    vorigeKaart = kaart;
    l.unshift({ p: PAD, t: titel, k: kaart || '', h: adres || '' });
    bewaarLaatst(l);
  }
  function toonLaatst() {
    var blok = document.getElementById('laatst');
    if (!blok) return;
    var en = function (p) { return /^en\//.test(p); };
    var l = leesLaatst().filter(function (x) { return x && typeof x.p === 'string' && /^[a-z0-9\/-]+\.html$/.test(x.p) && en(x.p) === ENGELS; }).slice(0, 4);
    var lijst = blok.querySelector('.laatst-lijst');
    if (!l.length) { blok.hidden = true; return; }
    var esc = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
    lijst.innerHTML = l.map(function (x) {
      var h = /^#(kaart|oefening)=/.test(x.h || '') ? x.h : '';
      return '<a href="' + esc(SITE + x.p + h) + '">' + esc(x.t) + (x.k ? '<span>' + esc(x.k) + '</span>' : '') + '</a>';
    }).join('') + '<button type="button" class="laatst-vergeet">' + T.vergeet + '</button>';
    lijst.querySelector('.laatst-vergeet').onclick = function () {
      bewaarLaatst(leesLaatst().filter(function (x) { return x && typeof x.p === 'string' && en(x.p) !== ENGELS; }));
      blok.hidden = true;
    };
    blok.hidden = false;
  }

  var gepland = false;
  function later() {
    if (gepland) return;
    gepland = true;
    setTimeout(function () { gepland = false; kaartKnoppen(); if (bezig) onthoud(); }, 0);
  }

  function start() {
    var stijl = document.createElement('style');
    stijl.textContent = CSS;
    document.head.appendChild(stijl);
    kaartKnoppen();
    new MutationObserver(later).observe(document.body, { childList: true, subtree: true });
    vraagSlot();
    onthoud();
    toonLaatst();
    window.addEventListener('pageshow', function (e) { if (e.persisted) toonLaatst(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
