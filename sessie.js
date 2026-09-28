/* Arsenaal van de Joker — koppeling met Mijn selectie
 *
 * Mijn selectie staat onderaan to-arsenaal.html: een eigen lijst van oefeningen die je
 * wilt onthouden, om wat voor reden dan ook. De lijst staat in de browser (localStorage,
 * sleutel 'to-sessie'; die naam is van vroeger en blijft, zodat bestaande lijsten bewaard blijven).
 * Dit script geeft de carouselpagina's een knop "+ selectie" op elke oefenkaart, een teller
 * die naar Mijn selectie linkt, en opent een kaart direct via het adres pagina.html#kaart=<titel>.
 *
 * Gebruik op een pagina:
 *   <script src="sessie.js"></script>
 *   <script>ArsenaalSessie.init({ oefeningen: { "Titel van de kaart": ["fase", duur, "energie", niveau, "naam in TO Arsenaal"?] } });</script>
 *
 * Alleen de titel en de eventuele naam in het TO Arsenaal worden nog gebruikt. Die naam zorgt
 * ervoor dat een oefening die ook in het TO Arsenaal staat één en dezelfde oefening in de lijst blijft.
 * Fase, duur, energie en niveau staan er nog van vroeger in, maar worden niet meer getoond.
 *
 * Kaarten zonder vermelding in 'oefeningen' krijgen geen knop.
 */
(function (global) {
  'use strict';
  var SLEUTEL = 'to-sessie';
  var cfg = null;

  // Leesbare naam van de pagina, zoals hij in Mijn selectie verschijnt
  var PLEK = {
    'beeldentheater.html': 'Beeldentheater',
    'feldenkrais.html': 'Feldenkrais',
    'impro.html': 'Impro',
    'introspectief.html': 'Introspectieve technieken',
    'krantentheater.html': 'Krantentheater',
    'playback.html': 'Playback Theatre',
    'prospectief.html': 'Prospectieve technieken',
    'psychodrama.html': 'Psychodrama'
  };

  var CSS = [
    '.sessie-knop{flex-shrink:0;align-self:flex-start;font-family:var(--mono,"JetBrains Mono",monospace);font-size:10px;line-height:1.4;padding:3px 9px;border-radius:20px;border:1px solid var(--paper4,#ddd4c4);background:var(--paper2,#f2ede4);color:var(--ink3,#9a9790);cursor:pointer;transition:background .12s,border-color .12s,color .12s;white-space:nowrap}',
    '.sessie-knop:hover{border-color:var(--ink3,#9a9790);color:var(--ink,#1a1814)}',
    '.sessie-knop.in-sessie{background:var(--ink,#1a1814);border-color:var(--ink,#1a1814);color:var(--paper,#faf8f4)}',
    '.head-badges .sessie-knop{margin-top:6px}',
    '.sessie-link{flex-shrink:0;display:inline-flex;align-items:center;gap:6px;line-height:1.4;font-family:var(--mono,"JetBrains Mono",monospace);font-size:10px;letter-spacing:.02em;color:var(--ink2,#4a4740);text-decoration:none;padding:4px 10px;border-radius:20px;border:1px solid var(--paper4,#ddd4c4);background:#fff;white-space:nowrap;transition:all .15s}',
    '.sessie-link:hover{border-color:var(--ink3,#9a9790);color:var(--ink,#1a1814)}',
    '.sessie-link .sl-n{background:var(--ink,#1a1814);color:var(--paper,#faf8f4);border-radius:20px;padding:1px 7px;font-weight:500}',
    '.sessie-link .sl-n.leeg{background:var(--paper3,#e8e1d4);color:var(--ink3,#9a9790)}',
    '.view-toggle{align-items:center}',
    '.view-toggle .sessie-link{margin-right:auto;padding:1px 10px}',
    '@keyframes sessie-gevonden{from{box-shadow:0 0 0 3px rgba(140,94,42,.45)}to{box-shadow:0 0 0 3px rgba(140,94,42,0)}}',
    '.sessie-gevonden{animation:sessie-gevonden 1.6s ease-out}'
  ].join('\n');

  function pagina() { return (location.pathname.split('/').pop() || 'index.html'); }
  function lees() {
    try { var l = JSON.parse(localStorage.getItem(SLEUTEL) || '[]'); return Array.isArray(l) ? l : []; }
    catch (e) { return []; }
  }
  function schrijf(lijst) {
    try { localStorage.setItem(SLEUTEL, JSON.stringify(lijst)); return true; }
    catch (e) { return false; }
  }
  function tekst(el) { return (el && el.textContent || '').replace(/\s+/g, ' ').trim(); }

  function item(titel) {
    var d = cfg.oefeningen[titel];
    if (!d) return null;
    var p = pagina();
    return { naam: d[4] || titel, titel: titel, pagina: p, plek: PLEK[p] || document.title.split(' — ')[0] };
  }

  function toggle(knop) {
    var it = item(knop.dataset.titel);
    if (!it) return;
    var lijst = lees();
    var i = lijst.findIndex(function (s) { return s.naam === it.naam; });
    if (i >= 0) lijst.splice(i, 1); else lijst.push(it);
    if (!schrijf(lijst)) { knop.textContent = 'niet beschikbaar'; return; }
    toon();
  }

  function zetKnoppen() {
    document.querySelectorAll(cfg.kaart).forEach(function (kaart) {
      if (kaart.querySelector('.sessie-knop')) return;
      var titel = tekst(kaart.querySelector(cfg.naam));
      if (!titel || !cfg.oefeningen[titel]) return;
      var plek = kaart.querySelector(cfg.plek) || kaart;
      var knop = document.createElement('button');
      knop.type = 'button';
      knop.className = 'sessie-knop';
      knop.dataset.titel = titel;
      plek.appendChild(knop);
    });
    toon();
  }

  function zetTeller() {
    if (document.querySelector('.sessie-link')) return;
    var doel = document.querySelector(cfg.teller);
    if (!doel) return;
    var a = document.createElement('a');
    a.className = 'sessie-link';
    a.href = 'to-arsenaal.html#selectie';
    a.title = 'Naar Mijn selectie';
    a.innerHTML = '<span class="sl-txt">Mijn selectie</span> <span class="sl-n leeg">0</span> →';
    if (cfg.tellerVooraan) doel.insertBefore(a, doel.firstChild); else doel.appendChild(a);
  }

  function toon() {
    var lijst = lees();
    var namen = {};
    lijst.forEach(function (s) { namen[s.naam] = true; });
    document.querySelectorAll('.sessie-knop').forEach(function (k) {
      var it = item(k.dataset.titel);
      var aan = !!(it && namen[it.naam]);
      k.classList.toggle('in-sessie', aan);
      var t = aan ? '✓ geselecteerd' : '+ selectie';
      if (k.textContent !== t) k.textContent = t;
      k.title = aan ? 'Uit Mijn selectie halen' : 'Bewaren in Mijn selectie';
    });
    var link = document.querySelector('.sessie-link');
    if (link) {
      var nEl = link.querySelector('.sl-n');
      nEl.textContent = lijst.length;
      nEl.classList.toggle('leeg', !lijst.length);
    }
  }

  // Adres pagina.html#kaart=<titel>: blader de carousel naar die kaart
  function huidigeTitel() { return tekst(document.querySelector(cfg.kaart + ' ' + cfg.naam)); }
  function gaNaarKaart() {
    var m = location.hash.match(/^#kaart=(.+)$/);
    if (!m) return;
    var doel;
    try { doel = decodeURIComponent(m[1]); } catch (e) { return; }
    if (typeof global.nextTech !== 'function' || typeof global.prevTech !== 'function') return;
    // Stap voor stap tonen als de pagina een overzicht heeft
    var stap = document.querySelector('.view-toggle .vt-btn[data-view="step"]');
    if (stap && !stap.classList.contains('on')) stap.click();
    var vorige = null, n = 0;
    while (huidigeTitel() !== vorige && n++ < 500) { vorige = huidigeTitel(); global.prevTech(); }
    vorige = null; n = 0;
    while (huidigeTitel() !== doel && huidigeTitel() !== vorige && n++ < 500) { vorige = huidigeTitel(); global.nextTech(); }
    var kaart = document.querySelector(cfg.kaart);
    if (kaart && huidigeTitel() === doel) {
      kaart.scrollIntoView({ block: 'start' });
      kaart.classList.remove('sessie-gevonden'); void kaart.offsetWidth; kaart.classList.add('sessie-gevonden');
    }
  }

  function init(opties) {
    cfg = Object.assign({
      oefeningen: {},
      kaart: '.card',
      naam: '.card-name',
      plek: '.head-badges',
      teller: '.view-toggle',
      tellerVooraan: true
    }, opties || {});

    var stijl = document.createElement('style');
    stijl.textContent = CSS;
    document.head.appendChild(stijl);

    // Klik op de knop: niet doorgeven aan de kaart (die kan zelf openklappen)
    document.addEventListener('click', function (e) {
      var k = e.target.closest && e.target.closest('.sessie-knop');
      if (!k) return;
      e.preventDefault();
      e.stopPropagation();
      toggle(k);
    }, true);

    zetTeller();
    zetKnoppen();

    // Carousels tekenen hun kaart opnieuw bij bladeren: knop dan opnieuw plaatsen
    var bezig = false;
    new MutationObserver(function () {
      if (bezig) return;
      bezig = true;
      requestAnimationFrame(function () { zetKnoppen(); bezig = false; });
    }).observe(document.body, { childList: true, subtree: true });

    window.addEventListener('storage', function (e) { if (e.key === SLEUTEL) toon(); });
    window.addEventListener('pageshow', toon);
    window.addEventListener('hashchange', gaNaarKaart);
    gaNaarKaart();
  }

  global.ArsenaalSessie = { init: init, lees: lees };
})(window);
