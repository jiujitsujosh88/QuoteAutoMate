(() => {
  // -----------------------------
  // App State
  // -----------------------------
  const App = {
    version: '0.3.0-i18n',
    plan: 'lite',          // 'lite' | 'pro'  (dev toggle later)
    role: 'tech',          // 'tech' | 'sa' | 'owner' (will wire in Settings)
    lang: 'en',            // ISO code
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
    }
  };

  // -----------------------------
  // i18n
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
      'ph.settings': 'Language, currency, role.',
      'ph.business': 'Business name, logo, contact, financial defaults.',
      'ph.resources': 'Employees, sublets, suppliers.'
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
      'ph.settings': 'Idioma, moneda, rol.',
      'ph.business': 'Nombre del negocio, logo, contacto y valores por defecto.',
      'ph.resources': 'Empleados, subcontratos, proveedores.'
    }
  };

  const t = (key) => {
    const dict = STRINGS[App.lang] || STRINGS.en;
    return dict[key] || STRINGS.en[key] || key;
  };

  function applyI18n(){
    // visible labels
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const k = el.getAttribute('data-i18n');
      el.textContent = t(k);
    });
    // tab aria labels
    const ariaMap = {
      'tab-quotes':'tabs.quotes','tab-history':'tabs.history','tab-customers':'tabs.customers',
      'tab-presets':'tabs.presets','tab-analytics':'tabs.analytics',
      'tab-settings':'more.settings','tab-business':'more.business','tab-resources':'more.resources'
    };
    Object.entries(ariaMap).forEach(([id,key])=>{
      const el = document.getElementById(id);
      if (el) el.setAttribute('aria-label', t(key));
    });
    // placeholders
    const ph = {
      quotes:'ph.quotes', history:'ph.history', customers:'ph.customers',
      presets:'ph.presets', analytics:'ph.analytics',
      settings:'ph.settings', business:'ph.business', resources:'ph.resources'
    };
    Object.entries(ph).forEach(([pane,key])=>{
      const el = document.querySelector('#tab-'+pane);
      if (!el) return;
      let block = el.querySelector('.placeholder');
      if (!block) {
        block = document.createElement('div');
        block.className = 'placeholder';
        el.appendChild(block);
      }
      block.textContent = t(key);
    });
  }

  // -----------------------------
  // Formatting helpers
  // -----------------------------
  const fmt = {
    money(v){
      try {
        return new Intl.NumberFormat(App.currency.locale, {
          style:'currency', currency:App.currency.code, currencyDisplay:'symbol', maximumFractionDigits:2
        }).format(v || 0);
      } catch(_){
        return `${App.currency.symbol}${(v||0).toFixed(2)}`;
      }
    },
    number(v){
      try { return new Intl.NumberFormat(App.currency.locale).format(v || 0); }
      catch(_){ return String(v ?? 0); }
    },
    date(d){
      try {
        const dt = (d instanceof Date) ? d : new Date(d);
        return new Intl.DateTimeFormat(App.currency.locale, {year:'numeric',month:'short',day:'2-digit'}).format(dt);
      } catch(_){ return String(d); }
    }
  };
  window.QAM = { App, t, fmt };

  // -----------------------------
  // Online/Offline + SW badge
  // -----------------------------
  function setOnlineStatus(){
    const el = document.getElementById('net-status'); if(!el) return;
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
    const el = document.getElementById('sw-status');
    if (el) el.textContent = `SW: ${text}`;
  }

  // -----------------------------
  // Tabs + More dialog
  // -----------------------------
  const $ = (sel, root=document) => root.querySelector(sel);
  const $all = (sel, root=document) => Array.from(root.querySelectorAll(sel));

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
        if (ttab) showTab(ttab);
      });
    });

    let last = 'quotes';
    try { const saved = localStorage.getItem('QAM_lastTab'); if (saved) last = saved; } catch(_) {}
    showTab(last);
  }

  // -----------------------------
  // Force Update (cache bust)
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
    document.getElementById('force-update')?.addEventListener('click', forceUpdate);
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
    App.save();
  });

  // -----------------------------
  // Service Worker
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