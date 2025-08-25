(() => {
  // -----------------------------
  // Minimal App State
  // -----------------------------
  const App = {
    version: '1.0.1-step1b-toasts+role-plan',
    plan: 'lite',              // 'lite' | 'pro' (dev toggle only)
    role: 'tech',              // 'tech' | 'sa' | 'owner'
    lang: 'en',                // 'en' | 'es' (sample)
    currency: { code: 'USD', symbol: '$', locale: 'en-US' },

    load(){
      try {
        const raw = localStorage.getItem('QAM_STATE');
        if (raw) Object.assign(this, JSON.parse(raw));
      } catch(_) {}
    },
    save(){
      try {
        localStorage.setItem('QAM_STATE', JSON.stringify({
          version:this.version, plan:this.plan, role:this.role,
          lang:this.lang, currency:this.currency
        }));
      } catch(_) {}
    },
    clearAll(){
      try { localStorage.clear(); } catch(_) {}
    }
  };

  // Expose for console testing
  window.QAM = window.QAM || {};
  window.QAM.App = App;

  // -----------------------------
  // i18n (simple)
  // -----------------------------
  const STRINGS = {
    en: {
      'app.title': 'Quote AutoMate',
      'tabs.quotes': 'Quotes',
      'tabs.history': 'History',
      'tabs.customers': 'Customers',
      'tabs.presets': 'Presets',
      'tabs.analytics': 'Analytics',
      'tabs.more': 'More',

      'more.title': 'More',
      'more.settings': 'Settings',
      'more.business': 'Business Info',
      'more.resources': 'Resources',
      'more.forceUpdate': 'Force Update (clear cache & reload)',
      'more.close': 'Close',

      'ph.quotes': 'Start your quote flow here.',
      'ph.history': 'Recent quotes. (Later: quick-add from prior tickets.)',
      'ph.customers': 'Customer list & quick search.',
      'ph.presets': 'Your saved presets will appear here.',
      'ph.analytics': 'KPIs & date-range reports.',
      'ph.settings': 'Language, plan, role.',
      'ph.business': 'Business name, logo, contact, financial defaults.',
      'ph.resources': 'Employees, sublets, suppliers.',

      // toasts / confirm
      'toast.saved': 'Saved',
      'toast.cleared': 'Cleared',
      'toast.error': 'Something went wrong',
      'confirm.title': 'Please confirm',
      'confirm.clear': 'This will erase local data. Continue?',

      // settings labels
      'settings.section': 'Settings demo',
      'settings.lang': 'Language',
      'settings.plan': 'Plan',
      'settings.role': 'Role',
      'settings.save': 'Save',
      'settings.seed': 'Seed Demo (+2)',
      'settings.clear': 'Clear Data',
      'settings.seedcount': 'Seed count:'
    },
    es: {
      'app.title': 'Quote AutoMate',
      'tabs.quotes': 'Cotizaciones',
      'tabs.history': 'Historial',
      'tabs.customers': 'Clientes',
      'tabs.presets': 'Preajustes',
      'tabs.analytics': 'Análisis',
      'tabs.more': 'Más',

      'more.title': 'Más',
      'more.settings': 'Ajustes',
      'more.business': 'Información del negocio',
      'more.resources': 'Recursos',
      'more.forceUpdate': 'Forzar actualización (borrar caché y recargar)',
      'more.close': 'Cerrar',

      'ph.quotes': 'Comienza tu flujo de cotización aquí.',
      'ph.history': 'Cotizaciones recientes. (Después: añadir rápido desde tickets previos.)',
      'ph.customers': 'Lista de clientes y búsqueda rápida.',
      'ph.presets': 'Tus preajustes aparecerán aquí.',
      'ph.analytics': 'KPIs e informes por rango de fechas.',
      'ph.settings': 'Idioma, plan, rol.',
      'ph.business': 'Nombre del negocio, logo, contacto y valores por defecto.',
      'ph.resources': 'Empleados, subcontratos, proveedores.',

      'toast.saved': 'Guardado',
      'toast.cleared': 'Borrado',
      'toast.error': 'Algo salió mal',
      'confirm.title': 'Confirma por favor',
      'confirm.clear': 'Esto borrará los datos locales. ¿Continuar?',

      'settings.section': 'Demo de ajustes',
      'settings.lang': 'Idioma',
      'settings.plan': 'Plan',
      'settings.role': 'Rol',
      'settings.save': 'Guardar',
      'settings.seed': 'Semilla Demo (+2)',
      'settings.clear': 'Borrar datos',
      'settings.seedcount': 'Contador de semilla:'
    }
  };
  const t = (key) => {
    const dict = STRINGS[App.lang] || STRINGS.en;
    return dict[key] || STRINGS.en[key] || key;
  };
  window.QAM.t = t;

  function applyI18n(){
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const k = el.getAttribute('data-i18n');
      el.textContent = t(k);
    });

    const ariaMap = {
      'tab-quotes':'tabs.quotes','tab-history':'tabs.history','tab-customers':'tabs.customers',
      'tab-presets':'tabs.presets','tab-analytics':'tabs.analytics',
      'tab-settings':'more.settings','tab-business':'more.business','tab-resources':'more.resources'
    };
    Object.entries(ariaMap).forEach(([id,key])=>{
      const el = document.getElementById(id);
      if (el) el.setAttribute('aria-label', t(key));
    });

    const title = document.querySelector('.app-title');
    if (title) title.textContent = t('app.title');
  }

  // -----------------------------
  // Toasts
  // -----------------------------
  function showToast(message, kind='ok', ms=2200){
    const wrap = document.getElementById('toast-wrap');
    if (!wrap) return;
    const toast = document.createElement('div');
    toast.className = `toast ${kind}`;
    toast.innerHTML = `
      <span class="dot ${kind}"></span>
      <span class="toast-msg">${message}</span>
      <button class="toast-close" aria-label="Close">×</button>
    `;
    const close = () => toast.remove();
    toast.querySelector('.toast-close').addEventListener('click', close);
    wrap.appendChild(toast);
    if (ms > 0) setTimeout(close, ms);
  }
  window.QAM.toast = showToast;

  // -----------------------------
  // Confirm dialog (Promise-based)
  // -----------------------------
  function confirmDialog(message){
    return new Promise((resolve)=>{
      const dlg = document.getElementById('confirm-dialog');
      const msg = document.getElementById('confirm-message');
      const title = document.getElementById('confirm-title');
      const ok = document.getElementById('confirm-ok');
      const cancel = document.getElementById('confirm-cancel');
      if (!dlg) return resolve(false);

      title.textContent = t('confirm.title');
      msg.textContent = message;

      const onCancel = () => { cleanup(); resolve(false); };
      const onOk = () => { cleanup(); resolve(true); };

      function cleanup(){
        cancel.removeEventListener('click', onCancel);
        ok.removeEventListener('click', onOk);
        if (dlg.open) dlg.close();
      }

      cancel.addEventListener('click', onCancel);
      ok.addEventListener('click', onOk);

      dlg.showModal();
    });
  }
  window.QAM.confirm = confirmDialog;

  // -----------------------------
  // Helpers
  // -----------------------------
  const $ = (sel, root=document) => root.querySelector(sel);
  const $all = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function setOnlineStatus(){
    const el = $('#net-status'); if(!el) return;
    const online = navigator.onLine;
    el.textContent = online ? 'Online' : 'Offline';
    el.classList.toggle('online', online);
    el.classList.toggle('offline', !online);
  }
  function initNet(){
    setOnlineStatus();
    addEventListener('online', setOnlineStatus);
    addEventListener('offline', setOnlineStatus);
  }
  function setSWBadge(text){
    const el = $('#sw-status'); if (el) el.textContent = `SW: ${text}`;
  }

  // -----------------------------
  // Tabs + More
  // -----------------------------
  function showTab(tab){
    $all('.tab-pane').forEach(p => { p.classList.remove('active'); p.hidden = true; });
    const pane = $('#tab-' + tab);
    if (pane){ pane.hidden = false; pane.classList.add('active'); }
    $all('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
    try { localStorage.setItem('QAM_lastTab', tab); } catch(_) {}
    closeMore();
  }
  function openMore(){ const dlg = $('#more-dialog'); if (dlg && !dlg.open) dlg.showModal(); }
  function closeMore(){ const dlg = $('#more-dialog'); if (dlg && dlg.open) dlg.close(); }

  function initTabs(){
    $all('.tab-btn').forEach(btn=>{
      btn.addEventListener('click', () => {
        const ttab = btn.dataset.tab;
        if (ttab === 'more'){ openMore(); return; }
        showTab(ttab);
      }, {passive:true});
    });
    $('#more-close')?.addEventListener('click', closeMore);
    $all('.more-item').forEach(item=>{
      item.addEventListener('click', (e)=>{
        e.preventDefault();
        const ttab = item.dataset.tab;
        if (ttab){ showTab(ttab); }
      });
    });

    let last = 'quotes';
    try { const saved = localStorage.getItem('QAM_lastTab'); if (saved) last = saved; } catch(_) {}
    showTab(last);
  }

  // -----------------------------
  // Placeholders
  // -----------------------------
  function mountPlaceholders(){
    const fillers = {
      quotes:'ph.quotes',
      history:'ph.history',
      customers:'ph.customers',
      presets:'ph.presets',
      analytics:'ph.analytics',
      settings:'ph.settings',
      business:'ph.business',
      resources:'ph.resources'
    };
    Object.entries(fillers).forEach(([k,key])=>{
      const el = $('#tab-'+k);
      if (el && !el.dataset.mounted){
        const block = document.createElement('div');
        block.className = 'placeholder'; block.textContent = t(key);
        el.appendChild(block); el.dataset.mounted='1';
      } else if (el){
        const p = el.querySelector('.placeholder');
        if (p) p.textContent = t(key);
      }
    });
  }

  // -----------------------------
  // Force Update
  // -----------------------------
  async function forceUpdate(){
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({type:'SKIP_WAITING'});
      }
    } catch(e){}
    location.reload();
  }
  function initForceUpdate(){
    $('#force-update')?.addEventListener('click', forceUpdate);
  }

  // -----------------------------
  // Settings demo (now with Plan + Role)
  // -----------------------------
  function wireSettingsDemo(){
    const pane = $('#tab-settings');
    if (!pane) return;

    if (!pane.dataset.demoBuilt){
      const wrap = document.createElement('div');
      wrap.innerHTML = `
        <div class="placeholder" style="border-style:solid">
          <div style="margin-bottom:8px"><strong data-i18n="settings.section">Settings demo</strong></div>

          <div style="display:grid;gap:8px;grid-template-columns:1fr;">
            <label><span data-i18n="settings.lang">Language</span>:
              <select id="lang">
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </label>

            <label><span data-i18n="settings.plan">Plan</span>:
              <select id="plan">
                <option value="lite">Lite</option>
                <option value="pro">Pro</option>
              </select>
            </label>

            <label><span data-i18n="settings.role">Role</span>:
              <select id="role">
                <option value="tech">Tech</option>
                <option value="sa">Service Advisor</option>
                <option value="owner">Owner</option>
              </select>
            </label>
          </div>

          <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
            <button id="save-btn" class="btn primary" data-i18n="settings.save">Save</button>
            <button id="seed-btn" class="btn" data-i18n="settings.seed">Seed Demo (+2)</button>
            <button id="clear-btn" class="btn danger" data-i18n="settings.clear">Clear Data</button>
          </div>

          <div style="margin-top:8px;font-size:.9rem;color:var(--muted)">
            <span data-i18n="settings.seedcount">Seed count:</span>
            <span id="seed-count">0</span>
          </div>
        </div>
      `;
      pane.appendChild(wrap);
      pane.dataset.demoBuilt = '1';
    }

    // Restore state to controls
    $('#lang').value = App.lang;
    $('#plan').value = App.plan;
    $('#role').value = App.role;
    $('#seed-count').textContent = String(parseInt(localStorage.getItem('QAM_SEED')||'0',10));

    // Save
    $('#save-btn').onclick = () => {
      App.lang = $('#lang').value;
      App.plan = $('#plan').value;
      App.role = $('#role').value;
      App.save();
      applyI18n();
      mountPlaceholders();
      showToast(t('toast.saved'), 'ok');
    };

    // Seed demo counter
    $('#seed-btn').onclick = () => {
      const n = (parseInt(localStorage.getItem('QAM_SEED')||'0',10) + 2);
      localStorage.setItem('QAM_SEED', String(n));
      $('#seed-count').textContent = String(n);
      showToast('Seed +2', 'ok');
    };

    // Clear with confirm
    $('#clear-btn').onclick = async () => {
      const ok = await confirmDialog(t('confirm.clear'));
      if (!ok) return;
      App.clearAll();
      showToast(t('toast.cleared'), 'err');
      location.reload();
    };
  }

  // -----------------------------
  // Boot
  // -----------------------------
  document.addEventListener('DOMContentLoaded', () => {
    App.load();
    applyI18n();
    initNet();
    initTabs();
    initForceUpdate();
    mountPlaceholders();
    wireSettingsDemo();
    App.save();
  });

  // -----------------------------
  // SW registration
  // -----------------------------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const reg = await navigator.serviceWorker.register('./service-worker.js');
        setSWBadge(reg.active ? 'registered' : 'installing');
        navigator.serviceWorker.addEventListener('controllerchange', ()=> setSWBadge('updated'));
      } catch(e){
        setSWBadge('error');
      }
    });
  } else {
    setSWBadge('n/a');
  }
})();