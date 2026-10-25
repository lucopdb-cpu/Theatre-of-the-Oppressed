/* Arsenaal van de Joker — zoeken in de hele site
 *
 * Wordt vanzelf geladen door thema.js (dat op elke pagina staat); een pagina hoeft hier niets voor te doen.
 *
 * - Knop met vergrootglas in de balk bovenaan (naast EN/NL en zon/maan). Ook te openen met / of Ctrl+K (⌘K).
 * - Zoekt met Pagefind in de map pagefind/ (gebouwd door hulpmiddelen/zoekindex.mjs, op GitHub vanzelf
 *   bij elke wijziging). Elke oefening, kaart en bronvermelding is een eigen resultaat.
 * - Taal: zoekt in de taal van de pagina (<html lang>). Pagina's die (nog) niet in die taal bestaan, komen
 *   ook mee uit de andere talen, met de naam van die taal erbij. Teksten van het venster staan in TEKST
 *   hieronder; een taal die daar niet in staat, krijgt de Engelse teksten.
 * - Adressen pagina.html#kaart=<titel>: bladert de kaartpagina naar die kaart. Op pagina's met sessie.js
 *   doet sessie.js dat al; hier gebeurt het voor de andere kaartpagina's.
 */
(function () {
  'use strict';
  var root = document.documentElement;
  var eigen = document.currentScript && document.currentScript.src;
  var SITE = eigen ? eigen.replace(/zoeken\.js(?:[?#].*)?$/, '') : new URL('./', location.href).href;
  var TAAL = (root.getAttribute('lang') || 'nl').toLowerCase().slice(0, 2);

  var TEKST = {
    nl: { knop: 'Zoeken in het Arsenaal', veld: 'Zoek in het hele Arsenaal', sluit: 'Sluiten', bezig: 'Zoeken…',
          geen: function (q) { return 'Niets gevonden voor “' + q + '”.'; },
          aantal: function (n) { return n === 1 ? '1 resultaat' : n + ' resultaten'; },
          meer: 'Meer resultaten', fout: 'Zoeken lukt nu niet. Probeer het later opnieuw.',
          hulp: '↑ ↓ kiezen · Enter openen · Esc sluiten' },
    en: { knop: 'Search the Arsenal', veld: 'Search the whole Arsenal', sluit: 'Close', bezig: 'Searching…',
          geen: function (q) { return 'Nothing found for “' + q + '”.'; },
          aantal: function (n) { return n === 1 ? '1 result' : n + ' results'; },
          meer: 'More results', fout: 'Search is not available right now. Please try again later.',
          hulp: '↑ ↓ choose · Enter open · Esc close' },
    fr: { knop: 'Rechercher dans l’Arsenal', veld: 'Rechercher dans tout l’Arsenal', sluit: 'Fermer', bezig: 'Recherche…',
          geen: function (q) { return 'Aucun résultat pour « ' + q + ' ».'; },
          aantal: function (n) { return n === 1 ? '1 résultat' : n + ' résultats'; },
          meer: 'Plus de résultats', fout: 'La recherche n’est pas disponible pour le moment. Réessayez plus tard.',
          hulp: '↑ ↓ choisir · Entrée ouvrir · Échap fermer' },
    de: { knop: 'Im Arsenal suchen', veld: 'Im ganzen Arsenal suchen', sluit: 'Schließen', bezig: 'Suche…',
          geen: function (q) { return 'Nichts gefunden für „' + q + '“.'; },
          aantal: function (n) { return n === 1 ? '1 Ergebnis' : n + ' Ergebnisse'; },
          meer: 'Weitere Ergebnisse', fout: 'Die Suche ist gerade nicht verfügbar. Bitte später erneut versuchen.',
          hulp: '↑ ↓ wählen · Enter öffnen · Esc schließen' },
    es: { knop: 'Buscar en el Arsenal', veld: 'Buscar en todo el Arsenal', sluit: 'Cerrar', bezig: 'Buscando…',
          geen: function (q) { return 'No se encontró nada para «' + q + '».'; },
          aantal: function (n) { return n === 1 ? '1 resultado' : n + ' resultados'; },
          meer: 'Más resultados', fout: 'La búsqueda no está disponible ahora. Inténtalo más tarde.',
          hulp: '↑ ↓ elegir · Intro abrir · Esc cerrar' },
    pt: { knop: 'Pesquisar no Arsenal', veld: 'Pesquisar em todo o Arsenal', sluit: 'Fechar', bezig: 'Pesquisando…',
          geen: function (q) { return 'Nada encontrado para “' + q + '”.'; },
          aantal: function (n) { return n === 1 ? '1 resultado' : n + ' resultados'; },
          meer: 'Mais resultados', fout: 'A pesquisa não está disponível agora. Tente novamente mais tarde.',
          hulp: '↑ ↓ escolher · Enter abrir · Esc fechar' }
  };
  var T = TEKST[TAAL] || TEKST.en;
  var PER_KEER = 10;

  function taalNaam(code) {
    try { return new Intl.DisplayNames([TAAL], { type: 'language' }).of(code); } catch (e) { return code.toUpperCase(); }
  }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  // Uittreksel van Pagefind: alleen <mark> laten staan
  function uittreksel(s) {
    return esc(s).replace(/&lt;mark&gt;/g, '<mark>').replace(/&lt;\/mark&gt;/g, '</mark>');
  }

  var VERGROOTGLAS = '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="4.6" stroke="currentColor" stroke-width="1.5"/><path d="M10.4 10.4L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

  var CSS = [
    /* knop */
    '.zoek-knop{display:inline-flex;align-items:center;justify-content:center;width:34px;height:31px;margin-left:auto;padding:0;border:none;border-radius:999px;background:rgba(60,45,30,.07);color:#52504a;cursor:pointer;transition:background .15s,color .15s}',
    '.zoek-knop:hover{background:rgba(60,45,30,.13);color:#1a1814}',
    '.zoek-knop:focus-visible{outline:2px solid #8c5e2a;outline-offset:2px}',
    '.zoek-knop + .taal-knop,.zoek-knop + .thema-knop{margin-left:0}',
    '.zoek-knop.los{position:absolute;top:14px;z-index:50}',
    '@media print{.zoek-knop,.zoek-venster{display:none!important}}',
    /* venster */
    '.zoek-venster{--zv-papier:#faf8f4;--zv-papier2:#f2ede4;--zv-lijn:#e3dccf;--zv-inkt:#1a1814;--zv-inkt2:#52504a;--zv-inkt3:#8a857b;--zv-amber:#8c5e2a;--zv-mark:rgba(196,140,64,.28);',
    'width:min(680px,calc(100vw - 32px));max-height:min(78vh,760px);margin:9vh auto auto;padding:0;border:1px solid var(--zv-lijn);border-radius:14px;background:var(--zv-papier);color:var(--zv-inkt);box-shadow:0 24px 60px rgba(30,22,12,.22),0 2px 8px rgba(30,22,12,.08);overflow:hidden;font-family:"Source Serif 4",Georgia,serif}',
    '.zoek-venster[open]{display:flex;flex-direction:column}',
    '.zoek-venster::backdrop{background:rgba(26,24,20,.42);backdrop-filter:blur(2px)}',
    '.zv-kop{display:flex;align-items:center;gap:10px;padding:14px 14px 12px 18px;border-bottom:1px solid var(--zv-lijn)}',
    '.zv-kop svg{flex-shrink:0;color:var(--zv-inkt3)}',
    '.zv-veld{flex:1;min-width:0;border:none;outline:none;background:transparent;color:var(--zv-inkt);font-family:inherit;font-size:19px;line-height:1.4;padding:4px 0}',
    '.zv-veld::placeholder{color:var(--zv-inkt3)}',
    '.zv-veld::-webkit-search-cancel-button{display:none}',
    '.zv-sluit{flex-shrink:0;border:none;border-radius:999px;background:rgba(60,45,30,.07);color:var(--zv-inkt2);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:12px;font-weight:500;padding:6px 12px;cursor:pointer}',
    '.zv-sluit:hover{background:rgba(60,45,30,.13);color:var(--zv-inkt)}',
    '.zv-status{padding:10px 18px 4px;font-family:"JetBrains Mono",ui-monospace,monospace;font-size:11px;letter-spacing:.04em;color:var(--zv-inkt3);min-height:15px}',
    '.zv-status:empty{display:none}',
    '.zv-lijst{list-style:none;margin:0;padding:4px 8px 8px;overflow-y:auto;flex:1;overscroll-behavior:contain}',
    '.zv-lijst li{margin:0}',
    '.zv-treffer{display:block;padding:11px 12px 12px;border-radius:9px;color:inherit;text-decoration:none;border:1px solid transparent}',
    '.zv-treffer:hover,.zv-treffer.actief{background:var(--zv-papier2);border-color:var(--zv-lijn)}',
    '.zv-treffer:focus-visible{outline:2px solid var(--zv-amber);outline-offset:-2px}',
    '.zv-plek{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-family:"JetBrains Mono",ui-monospace,monospace;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--zv-amber);margin-bottom:3px}',
    '.zv-taal{text-transform:none;letter-spacing:.02em;padding:1px 7px;border-radius:999px;background:rgba(60,45,30,.07);color:var(--zv-inkt2)}',
    '.zv-titel{font-family:"Playfair Display",Georgia,serif;font-size:17px;line-height:1.3;font-weight:600;color:var(--zv-inkt)}',
    '.zv-tekst{margin-top:4px;font-size:14px;line-height:1.55;color:var(--zv-inkt2);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}',
    '.zv-tekst mark,.zv-titel mark{background:var(--zv-mark);color:inherit;border-radius:2px;padding:0 1px}',
    '.zv-meer{display:block;margin:6px auto 4px;border:1px solid var(--zv-lijn);border-radius:999px;background:transparent;color:var(--zv-inkt2);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:13px;padding:7px 16px;cursor:pointer}',
    '.zv-meer:hover{background:var(--zv-papier2);color:var(--zv-inkt)}',
    '.zv-voet{padding:9px 18px;border-top:1px solid var(--zv-lijn);font-family:"JetBrains Mono",ui-monospace,monospace;font-size:10.5px;letter-spacing:.03em;color:var(--zv-inkt3)}',
    '@media (max-width:600px){.zoek-venster{width:100vw;max-width:100vw;height:100%;max-height:100%;margin:0;border:none;border-radius:0}.zv-voet{display:none}.zv-veld{font-size:17px}}',
    '@media (hover:none){.zv-voet{display:none}}',
    '@keyframes kaart-gevonden{from{box-shadow:0 0 0 3px rgba(140,94,42,.45)}to{box-shadow:0 0 0 3px rgba(140,94,42,0)}}',
    '.kaart-gevonden{animation:kaart-gevonden 1.6s ease-out}',
    /* donker */
    '@media screen{',
    'html[data-thema="donker"] .zoek-knop{background:rgba(236,230,218,.08);color:#c9c1b3}',
    'html[data-thema="donker"] .zoek-knop:hover{background:rgba(236,230,218,.15);color:#f1ebe0}',
    'html[data-thema="donker"] .zoek-knop:focus-visible{outline-color:#d9a462}',
    'html[data-thema="donker"] .zoek-venster{--zv-papier:#1f1b17;--zv-papier2:#2a251f;--zv-lijn:#3a332a;--zv-inkt:#ece6da;--zv-inkt2:#c9c1b3;--zv-inkt3:#948b7e;--zv-amber:#d9a462;--zv-mark:rgba(217,164,98,.3);box-shadow:0 24px 60px rgba(0,0,0,.5)}',
    'html[data-thema="donker"] .zoek-venster::backdrop{background:rgba(0,0,0,.55)}',
    'html[data-thema="donker"] .zv-sluit,html[data-thema="donker"] .zv-taal{background:rgba(236,230,218,.08);color:#c9c1b3}',
    'html[data-thema="donker"] .zv-sluit:hover{background:rgba(236,230,218,.15);color:#f1ebe0}',
    '}'
  ].join('\n');

  // ── Pagefind ───────────────────────────────────────────
  var pf = null, andereTalen = [];
  function laadPagefind() {
    if (pf) return pf;
    pf = import(SITE + 'pagefind/pagefind.js').then(function (mod) {
      // herkomst: een kunstmatig filter per index (eigen taal of andere taal), zie zoek()
      return Promise.resolve(mod.options({ baseUrl: '/', excerptLength: 26, mergeFilter: { herkomst: 'eigen' } }))
        .then(function () { return fetch(SITE + 'pagefind/pagefind-entry.json'); })
        .then(function (r) { return r.ok ? r.json() : { languages: {} }; })
        .catch(function () { return { languages: {} }; })
        .then(function (entry) {
          // De andere talen meenemen, maar alleen voor pagina's die (nog) niet in de taal van deze pagina bestaan
          andereTalen = Object.keys(entry.languages || {}).filter(function (l) { return l !== TAAL && l !== 'unknown'; });
          return Promise.all(andereTalen.map(function (l) {
            return Promise.resolve(mod.mergeIndex(SITE + 'pagefind/', { language: l, baseUrl: '/', indexWeight: 0.6, mergeFilter: { herkomst: 'ander' } })).catch(function () {});
          }));
        })
        .then(function () { return mod; });
    });
    pf.catch(function () { pf = null; });
    return pf;
  }

  // Adres van een resultaat: Pagefind geeft het adres vanaf de hoofdmap van de site
  function adres(url) {
    url = String(url || '');
    return /^https?:\/\//.test(url) ? url : SITE + url.replace(/^\/+/, '');
  }

  // ── venster ────────────────────────────────────────────
  var venster, veld, status, lijst, laatste = '', zoekNr = 0, treffers = [], getoond = 0, actief = -1, terugFocus = null;

  function maakVenster() {
    venster = document.createElement('dialog');
    venster.className = 'zoek-venster';
    venster.setAttribute('aria-label', T.knop);
    venster.innerHTML =
      '<div class="zv-kop">' + VERGROOTGLAS.replace('width="15" height="15"', 'width="18" height="18"') +
        '<input class="zv-veld" type="search" autocomplete="off" spellcheck="false" enterkeyhint="search" aria-label="' + esc(T.veld) + '" placeholder="' + esc(T.veld) + '">' +
        '<button type="button" class="zv-sluit">' + esc(T.sluit) + '</button>' +
      '</div>' +
      '<div class="zv-status" role="status" aria-live="polite"></div>' +
      '<ul class="zv-lijst"></ul>' +
      '<div class="zv-voet">' + esc(T.hulp) + '</div>';
    document.body.appendChild(venster);
    veld = venster.querySelector('.zv-veld');
    status = venster.querySelector('.zv-status');
    lijst = venster.querySelector('.zv-lijst');

    // Toetsen in het venster niet doorgeven aan de pagina (die heeft eigen sneltoetsen, zoals spatie en R)
    venster.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Escape') { e.preventDefault(); sluit(); }
    });
    venster.querySelector('.zv-sluit').addEventListener('click', sluit);
    venster.addEventListener('click', function (e) { if (e.target === venster) sluit(); });  // klik naast het venster
    venster.addEventListener('close', function () { if (terugFocus && terugFocus.focus) terugFocus.focus(); });
    var wacht = null;
    veld.addEventListener('input', function () { clearTimeout(wacht); wacht = setTimeout(zoek, 140); });
    veld.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); kies(actief + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); kies(actief - 1); }
      else if (e.key === 'Enter') {
        var a = lijst.querySelectorAll('.zv-treffer')[actief < 0 ? 0 : actief];
        if (a) { e.preventDefault(); a.click(); }
      }
    });
    lijst.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('.zv-treffer');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      var doel = new URL(a.href);
      if (doel.pathname === location.pathname && doel.search === location.search) {
        // Zelfde pagina: alleen het #-deel verandert; kaart opnieuw opzoeken, ook als het adres al gelijk was
        e.preventDefault();
        sluit();
        if (location.hash === doel.hash) window.dispatchEvent(new HashChangeEvent('hashchange'));
        else location.hash = doel.hash;
      }
    });
  }

  function kies(i) {
    var items = lijst.querySelectorAll('.zv-treffer');
    if (!items.length) return;
    actief = Math.max(0, Math.min(items.length - 1, i));
    items.forEach(function (a, j) { a.classList.toggle('actief', j === actief); });
    items[actief].scrollIntoView({ block: 'nearest' });
  }

  function open() {
    if (!venster) maakVenster();
    if (venster.open) { veld.focus(); veld.select(); return; }
    terugFocus = document.activeElement;
    if (venster.showModal) venster.showModal(); else venster.setAttribute('open', '');
    veld.focus();
    veld.select();
    laadPagefind();
  }
  function sluit() {
    if (!venster) return;
    if (venster.close) { if (venster.open) venster.close(); } else venster.removeAttribute('open');
  }

  function zoek() {
    var q = veld.value.trim();
    if (q === laatste) return;
    laatste = q;
    var nr = ++zoekNr;
    if (!q) { lijst.innerHTML = ''; status.textContent = ''; treffers = []; return; }
    status.textContent = T.bezig;
    laadPagefind().then(function (mod) {
      // Alles uit de eigen taal; uit andere talen alleen wat in de eigen taal ontbreekt
      // (de index geeft elke pagina het filter 'ontbreekt' met de talen waarin ze nog niet bestaat)
      return mod.search(q, { filters: { any: [{ herkomst: 'eigen' }, { ontbreekt: TAAL }] } });
    }).then(function (res) {
      if (nr !== zoekNr) return;
      treffers = (res && res.results) || [];
      getoond = 0; actief = -1;
      lijst.innerHTML = '';
      lijst.scrollTop = 0;
      status.textContent = treffers.length ? T.aantal(treffers.length) : T.geen(q);
      return toonMeer(nr);
    }).catch(function () {
      if (nr === zoekNr) { status.textContent = T.fout; lijst.innerHTML = ''; }
    });
  }

  // Volgende resultaten ophalen en tonen
  function toonMeer(nr) {
    var stuk = treffers.slice(getoond, getoond + PER_KEER);
    getoond += stuk.length;
    return Promise.all(stuk.map(function (r) { return r.data(); }))
      .then(function (data) {
        if (nr !== zoekNr) return;
        var html = '';
        data.forEach(function (d) {
          var m = d.meta || {};
          var anders = m.taal && m.taal !== TAAL ? m.taal : '';
          var taalAttr = anders ? ' lang="' + esc(anders) + '"' : '';
          html += '<li><a class="zv-treffer" href="' + esc(adres(d.url)) + '"' + (anders ? ' hreflang="' + esc(anders) + '"' : '') + '>' +
            '<div class="zv-plek"><span' + taalAttr + '>' + esc(m.onderdeel || '') + '</span>' +
              (anders ? '<span class="zv-taal">' + esc(taalNaam(anders)) + '</span>' : '') + '</div>' +
            '<div class="zv-titel"' + taalAttr + '>' + esc(m.title || d.url) + '</div>' +
            (d.excerpt ? '<div class="zv-tekst"' + taalAttr + '>' + uittreksel(d.excerpt) + '</div>' : '') +
            '</a></li>';
        });
        lijst.insertAdjacentHTML('beforeend', html);
        if (getoond < treffers.length) {
          var li = document.createElement('li');
          li.innerHTML = '<button type="button" class="zv-meer">' + esc(T.meer) + '</button>';
          li.firstChild.addEventListener('click', function () {
            var begin = getoond;
            li.parentNode.removeChild(li);
            toonMeer(nr).then(function () { kies(begin); veld.focus(); });
          });
          lijst.appendChild(li);
        }
      });
  }

  // ── knop ───────────────────────────────────────────────
  function zetKnop() {
    if (document.querySelector('.zoek-knop')) return;
    var knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'zoek-knop';
    knop.innerHTML = VERGROOTGLAS;
    knop.title = T.knop + ' (/)';
    knop.setAttribute('aria-label', T.knop);
    knop.setAttribute('aria-haspopup', 'dialog');
    knop.addEventListener('click', open);
    // Vóór de taalknop en de zon/maan-knop van thema.js
    var buur = document.querySelector('.taal-knop') || document.querySelector('.thema-knop');
    if (buur && buur.parentNode) {
      buur.parentNode.insertBefore(knop, buur);
      if (buur.classList.contains('los')) {
        knop.classList.add('los');
        // Rechts naast elkaar: zon/maan (34px) en eventueel de taalknop
        var taal = document.querySelector('.taal-knop.los');
        var rechts = 14 + 34 + 8 + (taal ? taal.offsetWidth + 8 : 0);
        knop.style.right = rechts + 'px';
      }
    } else {
      var nav = document.querySelector('.arsenaal-nav');
      if (nav) nav.appendChild(knop);
      else { knop.classList.add('los'); knop.style.right = '56px'; document.body.appendChild(knop); }
    }
  }

  // ── adres #kaart=<titel> op kaartpagina's zonder sessie.js ─
  function huidigeTitel() { var el = document.querySelector('.card .card-name'); return (el && el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function gaNaarKaart() {
    if (window.ArsenaalSessie) return;  // sessie.js doet het al
    var m = location.hash.match(/^#kaart=(.+)$/);
    if (!m || typeof window.nextTech !== 'function' || typeof window.prevTech !== 'function') return;
    var doel;
    try { doel = decodeURIComponent(m[1]); } catch (e) { return; }
    var stap = document.querySelector('.view-toggle .vt-btn[data-view="step"]');
    if (stap && !stap.classList.contains('on')) stap.click();
    var vorige = null, n = 0;
    while (huidigeTitel() !== vorige && n++ < 2000) { vorige = huidigeTitel(); window.prevTech(); }
    vorige = null; n = 0;
    while (huidigeTitel() !== doel && huidigeTitel() !== vorige && n++ < 2000) { vorige = huidigeTitel(); window.nextTech(); }
    var kaart = document.querySelector('.card');
    if (kaart && huidigeTitel() === doel) {
      kaart.scrollIntoView({ block: 'start' });
      kaart.classList.remove('kaart-gevonden'); void kaart.offsetWidth; kaart.classList.add('kaart-gevonden');
    }
  }

  // ── start ──────────────────────────────────────────────
  function start() {
    var stijl = document.createElement('style');
    stijl.textContent = CSS;
    document.head.appendChild(stijl);
    zetKnop();
    gaNaarKaart();
    window.addEventListener('hashchange', gaNaarKaart);
    document.addEventListener('keydown', function (e) {
      var t = e.target, typt = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey) && !e.altKey) { e.preventDefault(); open(); }
      else if (e.key === '/' && !typt && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); open(); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.ArsenaalZoeken = { open: open, sluit: sluit };
})();
