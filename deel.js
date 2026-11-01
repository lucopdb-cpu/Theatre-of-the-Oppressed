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
  var T = ENGELS
    ? { deel: 'Share', titel: 'Share this card', gekopieerd: 'Link copied', site: "A Joker's Arsenal" }
    : { deel: 'Delen', titel: 'Deze kaart doorsturen', gekopieerd: 'Link gekopieerd', site: 'Arsenaal van de Joker' };

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

  var gepland = false;
  function later() {
    if (gepland) return;
    gepland = true;
    setTimeout(function () { gepland = false; kaartKnoppen(); }, 0);
  }

  function start() {
    var stijl = document.createElement('style');
    stijl.textContent = CSS;
    document.head.appendChild(stijl);
    kaartKnoppen();
    new MutationObserver(later).observe(document.body, { childList: true, subtree: true });
    vraagSlot();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
