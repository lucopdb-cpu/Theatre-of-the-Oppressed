/* Arsenaal van de Joker — koppeling met de sessiebouwer
 *
 * De sessiebouwer staat in to-arsenaal.html en bewaart de sessie in de browser
 * (localStorage, sleutel 'to-sessie'). Dit script laat andere pagina's daar
 * oefeningen aan toevoegen: een knop "+ sessie" op elke oefenkaart en een teller
 * die naar de sessiebouwer linkt.
 *
 * Gebruik op een pagina:
 *   <script src="sessie.js"></script>
 *   <script>ArsenaalSessie.init({ oefeningen: { "Titel van de kaart": ["fase", duur, "energie", niveau, "naam in sessiebouwer"?] } });</script>
 *
 * fase:    opening · opwarming · vertrouwen · verdieping · beeldentheater · repetitie · forum · nabespreking · afsluiting · jokertraining
 * duur:    minuten (getal)
 * energie: hoog · middel · laag
 * niveau:  1 · 2 · 3
 * naam:    optioneel; gebruik de naam uit het TO Arsenaal als de oefening daar al staat,
 *          zodat het één en dezelfde oefening in de sessie blijft.
 *
 * Kaarten zonder vermelding in 'oefeningen' krijgen geen knop.
 */
(function (global) {
  'use strict';
  var SLEUTEL = 'to-sessie';
  var cfg = null;

  var CSS = [
    '.sessie-knop{flex-shrink:0;align-self:flex-start;font-family:var(--mono,"JetBrains Mono",monospace);font-size:10px;line-height:1.4;padding:3px 9px;border-radius:20px;border:1px solid var(--paper4,#ddd4c4);background:var(--paper2,#f2ede4);color:var(--ink3,#9a9790);cursor:pointer;transition:background .12s,border-color .12s,color .12s;white-space:nowrap}',
    '.sessie-knop:hover{border-color:var(--ink3,#9a9790);color:var(--ink,#1a1814)}',
    '.sessie-knop.in-sessie{background:var(--ink,#1a1814);border-color:var(--ink,#1a1814);color:var(--paper,#faf8f4)}',
    '.head-badges .sessie-knop{margin-top:6px}',
    '.sessie-link{flex-shrink:0;display:inline-flex;align-items:center;gap:6px;font-family:var(--mono,"JetBrains Mono",monospace);font-size:10px;letter-spacing:.02em;color:var(--ink2,#4a4740);text-decoration:none;padding:4px 10px;border-radius:20px;border:1px solid var(--paper4,#ddd4c4);background:#fff;white-space:nowrap;transition:all .15s}',
    '.sessie-link:hover{border-color:var(--ink3,#9a9790);color:var(--ink,#1a1814)}',
    '.sessie-link .sl-n{background:var(--ink,#1a1814);color:var(--paper,#faf8f4);border-radius:20px;padding:1px 7px;font-weight:500}',
    '.sessie-link .sl-n.leeg{background:var(--paper3,#e8e1d4);color:var(--ink3,#9a9790)}',
    '.view-toggle .sessie-link{margin-right:auto}',
    '@media (max-width:600px){.sessie-link .sl-txt{display:none}}'
  ].join('\n');

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
    return { naam: d[4] || titel, fase: d[0], duur: d[1], eng: d[2], niv: d[3] };
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
    a.href = 'to-arsenaal.html#sessie';
    a.title = 'Naar de sessiebouwer';
    a.innerHTML = '<span class="sl-txt">Sessie</span> <span class="sl-n leeg">0</span> <span class="sl-duur"></span>→';
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
      var t = aan ? '✓ in sessie' : '+ sessie';
      if (k.textContent !== t) k.textContent = t;
      k.title = aan ? 'Uit de sessie halen' : 'Toevoegen aan de sessiebouwer';
    });
    var link = document.querySelector('.sessie-link');
    if (link) {
      var n = lijst.length;
      var tot = lijst.reduce(function (a, s) { return a + (s.duur || 0); }, 0);
      var nEl = link.querySelector('.sl-n');
      nEl.textContent = n;
      nEl.classList.toggle('leeg', !n);
      link.querySelector('.sl-duur').textContent = n ? tot + ' min ' : '';
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
  }

  global.ArsenaalSessie = { init: init, lees: lees };
})(window);
