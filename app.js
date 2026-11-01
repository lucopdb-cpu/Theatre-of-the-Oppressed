/* Arsenaal van de Joker — de site als app op telefoon, tablet of computer
 *
 * Wordt vanzelf geladen door thema.js (dat op elke pagina staat); een pagina hoeft hier niets voor te doen.
 *
 * - Meldt de service worker (sw.js) aan. Die zorgt dat bezochte pagina's ook offline werken.
 * - Wordt het Arsenaal als app geopend (vanaf het beginscherm), dan vraagt dit script de service worker
 *   om de hele site op het toestel te zetten en die bij te houden (één keer per keer dat de app opent,
 *   alleen met internet). Wie de site gewoon in de browser bezoekt, downloadt dus niet ongevraagd alles.
 * - Bewaart de installeervraag van Chrome/Edge/Samsung Internet (beforeinstallprompt), zodat app.html een eigen
 *   knop "Installeer" kan tonen. Op app.html wordt de eigen balk van de browser onderdrukt; elders niet.
 * - Geeft pagina's een klein venster: window.ArsenaalApp
 *     .alsApp()        true als de site als geïnstalleerde app draait
 *     .toestel()       'ios', 'android' of 'anders'
 *     .kanInstalleren() true als de browser een installeerknop toestaat
 *     .installeer()    toont de installeervraag van de browser (geeft een Promise met 'accepted'/'dismissed')
 *     .opslaan()       zet de hele site op het toestel
 *     .stand()         vraagt op wat er al is opgeslagen
 *   en stuurt gebeurtenissen 'arsenaal-app' op document (detail: {type:'installeerbaar'|'geinstalleerd'|
 *   'voortgang'|'opgeslagen'|'stand'|'fout', ...}).
 */
(function () {
  'use strict';
  var eigen = document.currentScript && document.currentScript.src;
  var BASIS = eigen ? eigen.replace(/app\.js(?:[?#].*)?$/, '') : new URL('./', location.href).href;
  var OP_APP_PAGINA = /\/app\.html$/.test(location.pathname);

  function alsApp() {
    return (window.matchMedia && (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches)) ||
      window.navigator.standalone === true;
  }
  function toestel() {
    var ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    return 'anders';
  }
  function sein(detail) {
    try { document.dispatchEvent(new CustomEvent('arsenaal-app', { detail: detail })); } catch (e) { /* oude browser */ }
  }

  var vraag = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    if (OP_APP_PAGINA) e.preventDefault();
    vraag = e;
    sein({ type: 'installeerbaar' });
  });
  window.addEventListener('appinstalled', function () {
    vraag = null;
    sein({ type: 'geinstalleerd' });
  });

  var sw = 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');

  function naarSW(bericht) {
    if (!sw) return Promise.resolve(false);
    return navigator.serviceWorker.ready.then(function (reg) {
      var w = navigator.serviceWorker.controller || reg.active;
      if (!w) return false;
      w.postMessage(bericht);
      return true;
    });
  }

  window.ArsenaalApp = {
    alsApp: alsApp,
    toestel: toestel,
    ondersteund: function () { return sw; },
    kanInstalleren: function () { return !!vraag; },
    installeer: function () {
      if (!vraag) return Promise.resolve('niet');
      var v = vraag; vraag = null;
      v.prompt();
      return v.userChoice.then(function (k) { return k && k.outcome; });
    },
    opslaan: function () { return naarSW({ type: 'opslaan' }); },
    stand: function () { return naarSW({ type: 'stand' }); }
  };

  if (!sw) return;

  navigator.serviceWorker.addEventListener('message', function (e) {
    if (e.data && e.data.type) sein(e.data);
  });

  function aanmelden() {
    navigator.serviceWorker.register(BASIS + 'sw.js', { scope: BASIS }).catch(function () { /* geen app, de site werkt gewoon */ });
    // Als app geopend: de hele site op het toestel zetten en bijhouden (één keer per keer dat de app opent)
    if (alsApp() && navigator.onLine !== false) {
      var vlag = 'arsenaal-app-bijgewerkt';
      var al = false;
      try { al = sessionStorage.getItem(vlag) === '1'; sessionStorage.setItem(vlag, '1'); } catch (e) { /* geen opslag */ }
      if (!al) setTimeout(function () { window.ArsenaalApp.opslaan(); }, 1500);
    }
  }
  if (document.readyState === 'complete') aanmelden();
  else window.addEventListener('load', aanmelden);
})();
