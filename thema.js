/* Arsenaal van de Joker — licht of donker scherm
 *
 * Laden in de <head>, zonder defer, zodat de pagina meteen in de juiste kleur verschijnt:
 *   <script src="thema.js"></script>
 *
 * - Zonder eigen keuze volgt de site de instelling van het toestel (licht of donker).
 * - De knop met zon/maan in de balk bovenaan (.arsenaal-nav) legt een eigen keuze vast.
 *   Die wordt in de browser onthouden (localStorage 'arsenaal-thema') en geldt op alle pagina's.
 *   Kiest iemand wat het toestel toch al doet, dan wordt de keuze gewist en volgt de site weer het toestel.
 * - Het script zet <html data-thema="licht|donker">. Elke pagina geeft in haar eigen <style>
 *   de donkere kleuren onder  @media screen { html[data-thema="donker"] ... }.
 *   De gedeelde onderdelen (balk bovenaan, voettekst, laagregel, knoppen van sessie.js) staan hieronder.
 * - Printen blijft altijd licht.
 */
(function () {
  'use strict';
  var SLEUTEL = 'arsenaal-thema';
  var root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var PAPIER_DONKER = '#1a1713';
  // Zolang nog niet alle pagina's een donkere versie hebben: false (alleen de knop schakelt).
  // Als alles klaar is: true, dan volgt de site de instelling van het toestel.
  var VOLG_TOESTEL = false;

  function keuze() { try { return localStorage.getItem(SLEUTEL); } catch (e) { return null; } }
  function toestel() { return VOLG_TOESTEL && mq && mq.matches ? 'donker' : 'licht'; }
  function effectief() { var k = keuze(); return (k === 'licht' || k === 'donker') ? k : toestel(); }

  // Tekeningen die op een donkere achtergrond wegvallen: in donker een lichtere versie
  var WISSEL = { 'joker-donker.png': 'joker-goud.png' };

  var metaKleur = null;
  function pas() {
    var t = effectief();
    root.setAttribute('data-thema', t);
    root.style.colorScheme = t === 'donker' ? 'dark' : 'light';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      if (metaKleur === null) metaKleur = meta.getAttribute('content');
      meta.setAttribute('content', t === 'donker' ? PAPIER_DONKER : metaKleur);
    }
    document.querySelectorAll('img').forEach(function (img) {
      var src = img.getAttribute('src') || '';
      var bestand = src.split('/').pop();
      if (!img.dataset.lichtSrc && WISSEL[bestand]) img.dataset.lichtSrc = src;
      if (img.dataset.lichtSrc) {
        var licht = img.dataset.lichtSrc, naam = licht.split('/').pop();
        img.setAttribute('src', t === 'donker' ? licht.replace(naam, WISSEL[naam]) : licht);
      }
    });
    var knop = document.querySelector('.thema-knop');
    if (knop) {
      var naar = t === 'donker' ? 'licht' : 'donker';
      knop.setAttribute('aria-label', 'Naar ' + naar + ' scherm');
      knop.title = 'Naar ' + naar + ' scherm';
    }
  }

  function wissel() {
    var nieuw = effectief() === 'donker' ? 'licht' : 'donker';
    try {
      if (nieuw === toestel()) localStorage.removeItem(SLEUTEL);
      else localStorage.setItem(SLEUTEL, nieuw);
    } catch (e) {}
    root.classList.add('thema-overgang');
    pas();
    setTimeout(function () { root.classList.remove('thema-overgang'); }, 350);
  }

  var ZON = '<svg class="tk-zon" width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="3.2" stroke="currentColor" stroke-width="1.4"/><path d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3.05 3.05l1.13 1.13M11.82 11.82l1.13 1.13M3.05 12.95l1.13-1.13M11.82 4.18l1.13-1.13" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  var MAAN = '<svg class="tk-maan" width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M13.5 9.6A5.8 5.8 0 0 1 6.4 2.5a5.8 5.8 0 1 0 7.1 7.1z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';

  var CSS = [
    /* knop */
    '.thema-knop{display:inline-flex;align-items:center;justify-content:center;width:34px;height:31px;margin-left:auto;padding:0;border:none;border-radius:999px;background:rgba(60,45,30,.07);color:#52504a;cursor:pointer;transition:background .15s,color .15s}',
    '.thema-knop:hover{background:rgba(60,45,30,.13);color:#1a1814}',
    '.thema-knop:focus-visible{outline:2px solid #8c5e2a;outline-offset:2px}',
    '.thema-knop .tk-zon{display:none}',
    '.thema-knop.los{position:fixed;top:14px;right:14px;z-index:50}',
    'html.thema-overgang,html.thema-overgang *{transition:background-color .3s,color .3s,border-color .3s!important}',
    '@media print{.thema-knop{display:none!important}}',
    /* donker: gedeelde onderdelen */
    '@media screen{',
    'html[data-thema="donker"] .thema-knop .tk-zon{display:block}',
    'html[data-thema="donker"] .thema-knop .tk-maan{display:none}',
    'html[data-thema="donker"] .thema-knop,html[data-thema="donker"] .arsenaal-nav a{background:rgba(236,230,218,.08);color:#c9c1b3}',
    'html[data-thema="donker"] .thema-knop:hover,html[data-thema="donker"] .arsenaal-nav a:hover{background:rgba(236,230,218,.15);color:#f1ebe0}',
    'html[data-thema="donker"] .thema-knop:focus-visible,html[data-thema="donker"] .arsenaal-nav a:focus-visible{outline-color:#d9a462}',
    'html[data-thema="donker"] .arsenaal-footer{border-top-color:rgba(236,230,218,.14);color:#a39b8e}',
    'html[data-thema="donker"] .arsenaal-footer a{text-decoration-color:rgba(236,230,218,.3)}',
    'html[data-thema="donker"] .arsenaal-footer a:hover{color:#f1ebe0}',
    'html[data-thema="donker"] .arsenaal-footer strong{color:#d6cebf}',
    'html[data-thema="donker"] .arsenaal-footer .af-site{color:#8f877a}',
    'html[data-thema="donker"] .laagregel{color:#b3a58f}',
    'html[data-thema="donker"] img[src$="joker-blauw.png"]{filter:brightness(1.9) saturate(.85)}',
    'html[data-thema="donker"] .sessie-link{background:#221e19;border-color:#3e372e;color:#c7bfb1}',
    'html[data-thema="donker"] .sessie-link .sl-n{background:#ece6da;color:#1a1713}',
    'html[data-thema="donker"] .sessie-link .sl-n.leeg{background:#2f2a23;color:#948b7e}',
    'html[data-thema="donker"] .sessie-knop{background:#24201b;border-color:#3e372e;color:#948b7e}',
    'html[data-thema="donker"] .sessie-knop:hover{border-color:#948b7e;color:#ece6da}',
    'html[data-thema="donker"] .sessie-knop.in-sessie{background:#ece6da;border-color:#ece6da;color:#1a1713}',
    '}'
  ].join('\n');

  // Meteen toepassen, nog voor de pagina getekend wordt
  pas();
  var stijl = document.createElement('style');
  stijl.textContent = CSS;
  (document.head || root).appendChild(stijl);

  function zetKnop() {
    if (document.querySelector('.thema-knop')) return;
    var knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'thema-knop';
    knop.innerHTML = MAAN + ZON;
    knop.addEventListener('click', wissel);
    var nav = document.querySelector('.arsenaal-nav');
    if (nav) nav.appendChild(knop);
    else { knop.classList.add('los'); document.body.appendChild(knop); }
    pas();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', zetKnop);
  else zetKnop();

  if (mq) {
    if (mq.addEventListener) mq.addEventListener('change', pas);
    else if (mq.addListener) mq.addListener(pas);
  }
  window.addEventListener('storage', function (e) { if (e.key === SLEUTEL) pas(); });
  window.addEventListener('pageshow', pas);

  window.ArsenaalThema = { wissel: wissel, huidig: effectief };
})();
