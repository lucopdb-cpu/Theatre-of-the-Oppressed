/*!
 * Arsenaal van de Joker — shared navigation (swipe + keyboard)
 *
 * Gebruik in elke carousel:
 *
 *   <script src="nav.js" defer></script>
 *   <script>
 *     window.addEventListener('DOMContentLoaded', () => {
 *       ArsenaalNav.init({
 *         horizontal: { next: nextTech, prev: prevTech },
 *         vertical:   { next: nextStage, prev: prevStage }, // optioneel
 *         target:     document.body,                         // optioneel, default body
 *         threshold:  50                                     // optioneel, default 50px
 *       });
 *     });
 *   </script>
 *
 * - Horizontaal swipe / ArrowLeft / ArrowRight  -> prev/next (techniek/kaart)
 * - Verticaal swipe / ArrowUp / ArrowDown       -> prev/next (stap binnen kaart)
 * - Swipes op form-elementen, links, en scrollable blokken worden genegeerd.
 * - Idempotent: tweede init() op hetzelfde target overschrijft de eerste veilig.
 */
(function (global) {
  'use strict';

  const STATE = new WeakMap();

  function isInteractive(el) {
    if (!el) return false;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON' || tag === 'A') {
      return true;
    }
    if (el.isContentEditable) return true;
    return false;
  }

  // Wandel van target naar root en check of ergens scrollable horizontale content zit —
  // dan niet opeten (bijv. een horizontale pills-strip die zelf kan scrollen).
  function hasHorizontalScroll(startEl, stopEl) {
    let el = startEl;
    while (el && el !== stopEl && el.nodeType === 1) {
      if (el.scrollWidth > el.clientWidth + 2) {
        const style = getComputedStyle(el);
        const ox = style.overflowX;
        if (ox === 'auto' || ox === 'scroll') return true;
      }
      el = el.parentElement;
    }
    return false;
  }

  function init(opts) {
    const cfg = Object.assign({
      horizontal: null,
      vertical: null,
      target: document.body,
      threshold: 50,
      keyboard: true,
      touch: true,
    }, opts || {});

    if (!cfg.target) return;

    // Cleanup eventuele vorige listeners op hetzelfde target
    teardown(cfg.target);

    const state = { cfg, startX: 0, startY: 0, startT: 0, tracking: false };
    STATE.set(cfg.target, state);

    // --- Touch handlers ---
    const onTouchStart = (e) => {
      if (!cfg.touch) return;
      if (e.touches.length !== 1) { state.tracking = false; return; }
      const t = e.touches[0];
      if (isInteractive(e.target)) { state.tracking = false; return; }
      if (hasHorizontalScroll(e.target, cfg.target)) { state.tracking = false; return; }
      state.startX = t.clientX;
      state.startY = t.clientY;
      state.startT = Date.now();
      state.tracking = true;
    };

    const onTouchEnd = (e) => {
      if (!state.tracking) return;
      state.tracking = false;

      const touch = (e.changedTouches && e.changedTouches[0]) || null;
      if (!touch) return;

      const dx = touch.clientX - state.startX;
      const dy = touch.clientY - state.startY;
      const dt = Date.now() - state.startT;

      // Tijdslimiet: een tik die langer dan 800ms duurt = geen swipe
      if (dt > 800) return;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      const th = cfg.threshold;

      // Dominante as bepaalt richting
      if (absX > absY && absX > th && cfg.horizontal) {
        if (dx < 0 && typeof cfg.horizontal.next === 'function') cfg.horizontal.next();
        else if (dx > 0 && typeof cfg.horizontal.prev === 'function') cfg.horizontal.prev();
      } else if (absY > absX && absY > th && cfg.vertical) {
        if (dy < 0 && typeof cfg.vertical.next === 'function') cfg.vertical.next();
        else if (dy > 0 && typeof cfg.vertical.prev === 'function') cfg.vertical.prev();
      }
    };

    // --- Keyboard handler ---
    const onKey = (e) => {
      if (!cfg.keyboard) return;
      if (isInteractive(document.activeElement)) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      if (e.key === 'ArrowRight' && cfg.horizontal && typeof cfg.horizontal.next === 'function') {
        e.preventDefault();
        cfg.horizontal.next();
      } else if (e.key === 'ArrowLeft' && cfg.horizontal && typeof cfg.horizontal.prev === 'function') {
        e.preventDefault();
        cfg.horizontal.prev();
      } else if (e.key === 'ArrowDown' && cfg.vertical && typeof cfg.vertical.next === 'function') {
        e.preventDefault();
        cfg.vertical.next();
      } else if (e.key === 'ArrowUp' && cfg.vertical && typeof cfg.vertical.prev === 'function') {
        e.preventDefault();
        cfg.vertical.prev();
      }
    };

    // Attach — passive zodat pagina-scroll lekker blijft
    cfg.target.addEventListener('touchstart', onTouchStart, { passive: true });
    cfg.target.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('keydown', onKey);

    state.teardown = () => {
      cfg.target.removeEventListener('touchstart', onTouchStart);
      cfg.target.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('keydown', onKey);
      STATE.delete(cfg.target);
    };
  }

  function teardown(target) {
    const s = STATE.get(target);
    if (s && typeof s.teardown === 'function') s.teardown();
  }

  global.ArsenaalNav = { init, teardown, version: '1.0.0' };
})(window);
