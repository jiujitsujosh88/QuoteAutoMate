// Quote AutoMate - App.js
(() => {
  const State = { activeTab: 'quotes', deferredPrompt: null };
  const $ = (sel, root=document) => root.querySelector(sel);
  const $all = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  /* ---------------- Network Badge ---------------- */
  function setOnlineStatus() {
    const el = $('#net-status');
    if (!el) return;
    const online = navigator.onLine;
    el.textContent = online ? 'Online' : 'Offline';
    el.classList.toggle('online', online);
    el.classList.toggle('offline', !online);
  }
  function initNet() {
    setOnlineStatus();
    addEventListener('online', setOnlineStatus);
    addEventListener('offline', setOnlineStatus);
  }

  /* ---------------- Tabs ---------------- */
  function showTab(tab) {
    $all('.tab-pane').forEach(p => { p.classList.remove('active'); p.hidden = true; });
    const pane = $('#tab-' + tab);
    if (pane) { pane.hidden = false; pane.classList.add('active'); }
    $all('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
    hideMore();
    State.activeTab = tab;
    try { localStorage.setItem('lastTab', tab); } catch(_) {}
  }

  /* ---------------- More (dialog version) ---------------- */
  function openMore() {
    const dlg = $('#more-dialog');
    if (dlg) dlg.showModal();
  }
  function hideMore() {
    const dlg = $('#more-dialog');
    if (dlg && dlg.open) dlg.close();
  }

  function initTabs() {
    $all('.tab-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const t = btn.dataset.tab;
        if (t === 'more') { openMore(); return; }
        showTab(t);
      }, { passive: true });
    });

    $all('.more-item').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        const t = item.dataset.tab;
        if (t) { showTab(t); hideMore(); }
      }, { passive: false });
    });
    $('#more-close')?.addEventListener('click', () => hideMore());

    let last = 'quotes';
    try { const saved = localStorage.getItem('lastTab'); if (saved) last = saved; } catch(_) {}
    showTab(last);
  }

  /* ---------------- Placeholders ---------------- */
  function mountPlaceholders() {
    const fillers = {
      quotes: 'Start your quote flow here.',
      history: 'Recent quotes. (Later: quick-add from prior tickets.)',
      customers: 'Customer list & quick search.',
      presets: 'Your saved presets will appear here.',
      analytics: 'KPIs & date-range reports.',
      settings: 'Language, currency, role.',
      business: 'Business name, logo, contact, financial defaults.',
      resources: 'Employees, sublets, suppliers.'
    };
    Object.entries(fillers).forEach(([k, t]) => {
      const el = $('#tab-' + k);
      if (el && !el.dataset.mounted) {
        const block = document.createElement('div');
        block.className = 'placeholder';
        block.textContent = t;
        el.appendChild(block);
        el.dataset.mounted = '1';
      }
    });
  }

  /* ---------------- Force Update ---------------- */
  async function forceUpdate() {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }
    } catch (e) {}
    location.reload();
  }
  function initForceUpdate() {
    $('#force-update')?.addEventListener('click', forceUpdate);
  }

  /* ---------------- PWA Install ---------------- */
  function initInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      State.deferredPrompt = e;
      const btn = $('#install-btn');
      if (btn) btn.hidden = false;
      btn?.addEventListener('click', async () => {
        if (!State.deferredPrompt) return;
        State.deferredPrompt.prompt();
        const { outcome } = await State.deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          console.log('App installed');
        }
        State.deferredPrompt = null;
        btn.hidden = true;
      });
    });
  }

  /* ---------------- Boot ---------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initNet();
    initTabs();
    mountPlaceholders();
    initForceUpdate();
    initInstallPrompt();
  });
})();