// ===== app.js (v0.2.6) =====
(function () {
  console.log('[AQM] app.js loaded v0.2.6');

  // ---- Online/Offline indicator ----
  function setNet() {
    const el = document.getElementById('netStatus');
    if (!el) return;
    el.textContent = navigator.onLine ? 'Online' : 'Offline';
    el.className = navigator.onLine ? 'net-online' : 'net-offline';
  }
  window.addEventListener('online', setNet, { passive: true });
  window.addEventListener('offline', setNet, { passive: true });
  setNet();

  // ---- Tabs / Drawer ----
  function showTab(id) {
    // hide all panels
    document.querySelectorAll('.tab').forEach(p => {
      p.hidden = true;
      p.setAttribute('aria-hidden', 'true');
    });
    // show target
    const target = document.getElementById(id);
    if (target) {
      target.hidden = false;
      target.setAttribute('aria-hidden', 'false');
    }
    // set active state on nav buttons
    document.querySelectorAll('.nav-btn[data-tab]').forEach(b => {
      const on = b.getAttribute('data-tab') === id;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', String(on));
    });
    // close drawer if open
    const drawer = document.getElementById('moreDrawer');
    if (drawer && !drawer.hidden) toggleDrawer(false);
  }

  function toggleDrawer(forceState) {
    const btn = document.getElementById('moreBtn');
    const drawer = document.getElementById('moreDrawer');
    if (!btn || !drawer) return;
    const willOpen = typeof forceState === 'boolean' ? forceState : drawer.hidden;
    drawer.hidden = !willOpen;
    btn.setAttribute('aria-expanded', String(willOpen));
  }

  function initNav() {
    // bottom tab buttons
    document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-tab');
        if (id) showTab(id);
      }, { passive: true });
    });
    // more button
    const moreBtn = document.getElementById('moreBtn');
    if (moreBtn) {
      moreBtn.addEventListener('click', () => toggleDrawer(), { passive: true });
    }
    // drawer links
    document.querySelectorAll('.drawer-link[data-tab]').forEach(link => {
      link.addEventListener('click', () => {
        const id = link.getAttribute('data-tab');
        if (id) showTab(id);
      }, { passive: true });
    });

    // default tab
    showTab('quotes');
  }

  document.addEventListener('DOMContentLoaded', initNav, { passive: true });

  // ---- Service worker with auto-update ----
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => {
        console.log('[SW] registered:', reg.scope);

        // Auto-activate new versions and reload
        function tryReload() {
          // slight delay to let the new worker take control
          setTimeout(() => location.reload(), 250);
        }

        if (reg.waiting) {
          reg.waiting.postMessage('SKIP_WAITING');
          tryReload();
        }

        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              reg.waiting?.postMessage('SKIP_WAITING');
              tryReload();
            }
          });
        });
      })
      .catch(err => console.warn('[SW] register failed:', err));
  }
})();
