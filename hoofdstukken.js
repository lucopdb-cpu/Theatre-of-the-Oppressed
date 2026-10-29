/* Arsenaal van de Joker — menu met alle hoofdstukken
 *
 * Wordt vanzelf geladen door thema.js (dat op elke pagina staat); een pagina hoeft hier niets voor te doen.
 *
 * - Knop met drie streepjes linksboven in de balk, vóór "← Arsenaal van de Joker". Op de startpagina (zonder balk)
 *   staat de knop ook linksboven.
 * - De knop klapt een lijst uit met alle hoofdstukken, in dezelfde volgorde en groepen als de startpagina.
 *   De pagina waar je bent, is gemarkeerd. Sluiten met Esc, met de knop of door ernaast te klikken.
 * - Taal volgt <html lang>. Op Engelse pagina's wijzen de items naar de Engelse versie als die bestaat
 *   (EN hieronder op true); anders naar de Nederlandse pagina, met "NL" erachter.
 * - Hoofdstukken in opbouw of tijdelijk niet beschikbaar staan erin met 🚧 en zijn (nog) niet klikbaar:
 *   zet in plaats van een pagina null en als vijfde element de reden ('opbouw' of 'tijdelijk').
 * - Een nieuw hoofdstuk op de startpagina? Zet het dan ook in H hieronder.
 */
(function () {
  'use strict';
  var root = document.documentElement;
  var ENGELS = /^en/i.test(root.getAttribute('lang') || '');
  var eigen = document.currentScript && document.currentScript.src;
  var SITE = eigen ? eigen.replace(/hoofdstukken\.js(?:[?#].*)?$/, '') : new URL('./', location.href).href;

  // [groep NL, groep EN, [[pagina, titel NL, titel EN, Engelse versie bestaat], ...]]
  var H = [
    ['Joker-praktijk', 'Joker practice', [['joker-praktijk.html', 'Joker-praktijk', 'Joker practice', true]]],
    ['Humuslaag', 'Humus layer', [['freire.html', 'Paulo Freire — De koffer', 'Paulo Freire — The suitcase', true]]],
    ['Het centrale arsenaal', 'The central arsenal', [['to-arsenaal.html', 'TO Arsenaal', 'TO Arsenal', true]]],
    ['Beeldentheater', 'Image Theatre', [['beeldentheater.html', 'Beeldentheater', 'Image Theatre', true]]],
    ['Regenboog van het Verlangen', 'Rainbow of Desire', [
      ['introspectief.html', 'Introspectieve technieken', 'Introspective techniques', false],
      ['prospectief.html', 'Prospectieve technieken', 'Prospective techniques', false]]],
    ['Forumtheater', 'Forum Theatre', [
      ['forum.html', 'Forumtheater', 'Forum Theatre', true],
      ['to-arsenaal.html#fase=forum', 'Forum-oefeningen uit het arsenaal', 'Forum exercises from the arsenal', true]]],
    ['Krantentheater', 'Newspaper Theatre', [['krantentheater.html', 'Krantentheater', 'Newspaper Theatre', false]]],
    ['Theater in de publieke ruimte', 'Theatre in public space', [
      ['onzichtbaar.html', 'Onzichtbaar Theater', 'Invisible Theatre', false],
      ['legislatief.html', 'Legislatief Theater', 'Legislative Theatre', false]]],
    ['Theateratelier', 'Theateratelier', [['theateratelier.html', 'Theateratelier', 'Theateratelier', false]]],
    ['Atlas — TO in de wereld', 'Atlas — TO in the world', [
      ['wereld.html', 'Atlas en regionale verdiepingen', 'Atlas and regional deep dives', true],
      ['atlas.html', 'Praktijken in context', 'Practices in context', true, '', 1],
      [null, 'TO in MENA', 'TO in MENA', false, 'tijdelijk', 1],
      ['to-azie.html', 'TO in Azië', 'TO in Asia', false, '', 1],
      ['to-afrika.html', 'TO in Afrika', 'TO in Africa', false, '', 1],
      ['to-europa.html', 'TO in Europa', 'TO in Europe', false, '', 1],
      ['to-centroamerica.html', 'TO in Midden-Amerika', 'TO in Central America', false, '', 1],
      ['to-brasil.html', 'TO in Brazilië', 'TO in Brazil', false, '', 1],
      ['to-hispana-sur.html', 'TO in Hispanofoon Zuid-Amerika', 'TO in Spanish-speaking South America', false, '', 1],
      ['to-oceanie.html', 'TO in Oceania', 'TO in Oceania', false, '', 1],
      ['to-noord-amerika.html', 'TO in Noord-Amerika', 'TO in North America', false, '', 1]]],
    ['Aanvullende methodieken', 'Complementary methods', [
      ['playback.html', 'Playback Theatre', 'Playback Theatre', false],
      ['psychodrama.html', 'Psychodrama', 'Psychodrama', false],
      ['impro.html', 'Impro', 'Impro', false],
      ['feldenkrais.html', 'Feldenkrais', 'Feldenkrais', false],
      ['detentie.html', 'Theater in detentie', 'Theatre in Prison', false],
      [null, 'Shadow Liberation Theatre', 'Shadow Liberation Theatre', false, 'opbouw']]]
  ];
  var T = ENGELS
    ? { knop: 'Chapters', start: 'Home page', bronnen: 'Sources', opbouw: 'Under construction', tijdelijk: 'Temporarily unavailable' }
    : { knop: 'Hoofdstukken', start: 'Startpagina', bronnen: 'Bronnen', opbouw: 'In opbouw', tijdelijk: 'Tijdelijk niet beschikbaar' };

  var LIJST = '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 4h11M2.5 8h11M2.5 12h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

  var CSS = [
    '.hm-knop{display:inline-flex;align-items:center;justify-content:center;width:34px;height:31px;padding:0;border:none;border-radius:999px;background:rgba(60,45,30,.07);color:#52504a;cursor:pointer;transition:background .15s,color .15s}',
    '.hm-knop:hover,.hm-knop[aria-expanded="true"]{background:rgba(60,45,30,.13);color:#1a1814}',
    '.hm-knop:focus-visible{outline:2px solid #8c5e2a;outline-offset:2px}',
    '.hm-knop.los{position:absolute;top:14px;left:14px;z-index:60}',
    '.hm-paneel{position:absolute;z-index:70;width:min(640px,calc(100vw - 32px));max-height:min(72vh,640px);overflow:auto;padding:18px 20px 14px;border:1px solid rgba(60,45,30,.14);border-radius:14px;background:#faf7f1;box-shadow:0 14px 40px rgba(40,30,20,.16);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;color:#2a2824}',
    '.hm-paneel[hidden]{display:none}',
    '.hm-boven{display:flex;gap:8px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid rgba(60,45,30,.12)}',
    '.hm-boven a{font-size:13px;font-weight:500;color:#52504a;text-decoration:none;padding:4px 10px;border-radius:999px;background:rgba(60,45,30,.06)}',
    '.hm-boven a:hover{background:rgba(60,45,30,.12);color:#1a1814}',
    '.hm-kolommen{columns:2 250px;column-gap:28px}',
    '.hm-groep{break-inside:avoid;margin:0 0 12px}',
    '.hm-groep-naam{font-size:10.5px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:#8c6a3a;margin:0 0 3px}',
    '.hm-groep a{display:flex;align-items:baseline;gap:6px;padding:4px 8px;margin:0 -8px;border-radius:7px;font-size:14px;line-height:1.35;color:#2a2824;text-decoration:none}',
    '.hm-groep a:hover,.hm-groep a:focus-visible{background:rgba(60,45,30,.08);outline:none}',
    '.hm-groep a[aria-current="page"]{background:rgba(140,94,42,.13);font-weight:600}',
    '.hm-groep a[aria-current="page"]::before{content:"";width:6px;height:6px;border-radius:50%;background:#8c5e2a;flex-shrink:0;align-self:center}',
    '.hm-groep .hm-sub{padding-left:20px;font-size:13.5px}',
    '.hm-wip{display:flex;align-items:baseline;gap:6px;padding:4px 8px;margin:0 -8px;font-size:14px;line-height:1.35;color:#9a9790;cursor:default}',
    '.hm-wip .hm-teken{font-size:12px;align-self:center}',
    '.hm-nl{font-size:10px;font-weight:600;letter-spacing:.06em;color:#9a9790;border:1px solid rgba(60,45,30,.18);border-radius:4px;padding:0 4px}',
    '@media (max-width:520px){.hm-paneel{left:16px!important;right:16px;width:auto}.hm-kolommen{columns:1}}',
    /* Smalle schermen: de knoppen bovenaan op één regel houden. Onder 390px valt "← Arsenaal van de Joker" weg;
       de startpagina staat dan bovenin het menu. */
    '@media (max-width:420px){.arsenaal-nav{gap:6px}.arsenaal-nav > a:not(.taal-knop){padding-left:10px;padding-right:10px}}',
    '@media (max-width:389px){.arsenaal-nav > a:not(.taal-knop){display:none}}',
    '@media print{.hm-knop,.hm-paneel{display:none!important}}',
    'html[data-thema="donker"] .hm-knop{background:rgba(236,230,218,.08);color:#c9c1b3}',
    'html[data-thema="donker"] .hm-knop:hover,html[data-thema="donker"] .hm-knop[aria-expanded="true"]{background:rgba(236,230,218,.15);color:#f1ebe0}',
    'html[data-thema="donker"] .hm-paneel{background:#211d18;border-color:#3e372e;color:#e6dfd2;box-shadow:0 14px 40px rgba(0,0,0,.5)}',
    'html[data-thema="donker"] .hm-boven{border-color:#3e372e}',
    'html[data-thema="donker"] .hm-boven a{background:rgba(236,230,218,.07);color:#c9c1b3}',
    'html[data-thema="donker"] .hm-groep-naam{color:#d9a462}',
    'html[data-thema="donker"] .hm-groep a{color:#e6dfd2}',
    'html[data-thema="donker"] .hm-groep a:hover{background:rgba(236,230,218,.08)}',
    'html[data-thema="donker"] .hm-groep a[aria-current="page"]{background:rgba(217,164,98,.16)}',
    'html[data-thema="donker"] .hm-groep a[aria-current="page"]::before{background:#d9a462}',
    'html[data-thema="donker"] .hm-wip{color:#857d71}',
    'html[data-thema="donker"] .hm-nl{color:#948b7e;border-color:#3e372e}'
  ].join('\n');

  function huidig() {
    var p = location.pathname.split('/').pop() || 'index.html';
    return p;
  }
  function adres(pagina, en) { return SITE + (ENGELS && en ? 'en/' : '') + pagina; }

  var knop, paneel;

  function maakPaneel() {
    paneel = document.createElement('div');
    paneel.className = 'hm-paneel';
    paneel.id = 'hm-paneel';
    paneel.hidden = true;
    paneel.setAttribute('role', 'navigation');
    paneel.setAttribute('aria-label', T.knop);
    var hier = huidig(), html = '';
    html += '<div class="hm-boven"><a href="' + adres('index.html', true) + '">← ' + T.start + '</a><a href="' + SITE + 'bronnen.html"' + (ENGELS ? ' hreflang="nl"' : '') + '>' + T.bronnen + (ENGELS ? ' <span class="hm-nl">NL</span>' : '') + '</a></div>';
    html += '<div class="hm-kolommen">';
    H.forEach(function (g) {
      html += '<div class="hm-groep"><div class="hm-groep-naam">' + (ENGELS ? g[1] : g[0]) + '</div>';
      g[2].forEach(function (it) {
        var pagina = it[0], en = it[3], sub = it[5] ? ' hm-sub' : '';
        if (!pagina) {
          var reden = T[it[4]] || T.opbouw;
          html += '<span class="hm-wip' + sub + '" title="' + reden + '"><span>' + (ENGELS ? it[2] : it[1]) + '</span>' +
            '<span class="hm-teken" role="img" aria-label="' + reden + '">🚧</span></span>';
          return;
        }
        var zelfde = pagina.indexOf('#') < 0 && pagina === hier && (!ENGELS || en);
        html += '<a' + (sub ? ' class="' + sub.trim() + '"' : '') + ' href="' + adres(pagina, en) + '"' + (zelfde ? ' aria-current="page"' : '') + (ENGELS && !en ? ' hreflang="nl"' : '') + '>' +
          '<span>' + (ENGELS ? it[2] : it[1]) + '</span>' + (ENGELS && !en ? '<span class="hm-nl">NL</span>' : '') + '</a>';
      });
      html += '</div>';
    });
    html += '</div>';
    paneel.innerHTML = html;
    document.body.appendChild(paneel);
  }

  function plaats() {
    var r = knop.getBoundingClientRect();
    paneel.style.top = (r.bottom + window.scrollY + 8) + 'px';
    var links = r.left + window.scrollX;
    var max = document.documentElement.clientWidth - paneel.offsetWidth - 16;
    paneel.style.left = Math.max(16, Math.min(links, max)) + 'px';
  }
  function open() {
    paneel.hidden = false;
    knop.setAttribute('aria-expanded', 'true');
    plaats();
    var a = paneel.querySelector('[aria-current="page"]') || paneel.querySelector('a');
    if (a) a.focus({ preventScroll: true });
  }
  function dicht(terug) {
    if (paneel.hidden) return;
    paneel.hidden = true;
    knop.setAttribute('aria-expanded', 'false');
    if (terug) knop.focus();
  }

  function zetKnop() {
    if (document.querySelector('.hm-knop')) return;
    var stijl = document.createElement('style');
    stijl.textContent = CSS;
    document.head.appendChild(stijl);
    knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'hm-knop';
    knop.innerHTML = LIJST;
    knop.title = T.knop;
    knop.setAttribute('aria-label', T.knop);
    knop.setAttribute('aria-expanded', 'false');
    knop.setAttribute('aria-controls', 'hm-paneel');
    var nav = document.querySelector('.arsenaal-nav');
    if (nav) nav.insertBefore(knop, nav.firstChild);
    else { knop.classList.add('los'); document.body.appendChild(knop); }
    maakPaneel();
    knop.addEventListener('click', function (e) { e.stopPropagation(); paneel.hidden ? open() : dicht(); });
    document.addEventListener('click', function (e) { if (!paneel.hidden && !paneel.contains(e.target)) dicht(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') dicht(true); }, true);
    window.addEventListener('resize', function () { if (!paneel.hidden) plaats(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', zetKnop);
  else zetKnop();
})();
