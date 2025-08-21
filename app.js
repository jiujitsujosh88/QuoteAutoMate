// app.js — shell, i18n, tabs, SW, + light integration with models
(() => {
  const App = {
    version: '0.3.1-skeleton-b',
    plan: 'lite',          // 'lite' | 'pro'
    role: 'tech',          // 'tech' | 'sa' | 'owner'
    lang: 'en',
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

  // i18n
  const STRINGS = {
    en: {
      'app.title': 'Quote AutoMate',
      'tabs.quotes': 'Quotes','tabs.history': 'History','tabs.customers': 'Customers',
      'tabs.presets': 'Presets','tabs.analytics': 'Analytics','tabs.more': 'More',
      'more.title': 'More','more.settings': 'Settings','more.business': 'Business Info',
      'more.resources': 'Resources','more.forceUpdate': 'Force Update (clear cache & reload)','more.close': 'Close',
      'ph.quotes':'Start your quote flow here.',
      'ph.history':'Recent quotes. (Later: quick-add from prior tickets.)',
      'ph.customers':'Customer list & quick search.',
      'ph.presets':'Your saved presets will appear here.',
      'ph.analytics':'KPIs & date-range reports.',
      'ph.settings':'Language, currency, role.',
      'ph.business':'Business name, logo, contact, financial defaults.',
      'ph.resources':'Employees, sublets, suppliers.'
    },
    es: {
      'app.title': 'Quote AutoMate',
      'tabs.quotes': 'Cotizaciones','tabs.history': 'Historial','tabs.customers': 'Clientes',
      'tabs.presets': 'Preajustes','tabs.analytics': 'Análisis','tabs.more': 'Más',
      'more.title': 'Más','more.settings': 'Ajustes','more.business': 'Información del negocio',
      'more.resources': 'Recursos','more.forceUpdate': 'Forzar actualización (borrar caché y recargar)','more.close': 'Cerrar',
      'ph.quotes':'Comienza tu flujo de cotización aquí.',
      'ph.history':'Cotizaciones recientes. (Después: añadir rápido desde tickets previos.)',
      'ph.customers':'Lista de clientes y búsqueda rápida.',
      'ph.presets':'Tus preajustes aparecerán aquí.',
      'ph.analytics':'KPIs e informes por rango de fechas.',
      'ph.settings':'Idioma, moneda, rol.',
      'ph.business':'Nombre del negocio, logo, contacto y valores por defecto.',
      'ph.resources':'Empleados, subcontratos, proveedores.'
    }
  };
  const t = (k) => (STRINGS[App.lang]||STRINGS.en)[k] || STRINGS.en[k] || k;

  function applyI18n(){
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      el.textContent = t(el.getAttribute('data-i18n'));
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
    const ph = {
      quotes: 'ph.quotes', history:'ph.history', customers:'ph.customers',
      presets:'ph.presets', analytics:'ph.analytics',
      settings:'ph.settings', business:'ph.business', resources:'ph.resources'
    };
    Object.entries(ph).forEach(([pane,key])=>{
      const el = document.querySelector('#tab-'+pane);
      if (!el) return;
      const mount = () => {
        const block = document.createElement('div');
        block.className='placeholder'; block.textContent = t(key);
        el.appendChild(block); el.dataset.phMounted='1';
      };
      if (!el.dataset.phMounted) mount();
      else (el.querySelector('.placeholder')||{}).textContent = t(key);
    });
  }

  // format helpers
  const fmt = {
    money(v){
      try {
        return new Intl.NumberFormat(App.currency.locale, {
          style:'currency', currency:App.currency.code, currencyDisplay:'symbol', maximumFractionDigits:2
        }).format(v || 0);
      } catch(_){ return `${App.currency.symbol}${(v||0).toFixed(2)}`; }
    },
    number(v){ try { return new Intl.NumberFormat(App.currency.locale).format(v||0); } catch(_){ return String(v??0); } },
    date(d){ try {
      const dt = (d instanceof Date)? d : new Date(d);
      return new Intl.DateTimeFormat(App.currency.locale, {year:'numeric',month:'short',day:'2-digit'}).format(dt);
    } catch(_){ return String(d); } }
  };

  // expose to window
  window.QAM = window.QAM || {};
  Object.assign(window.QAM, { App, t, fmt });

  // online/offline + SW badge
  const setOnlineStatus = () => {
    const el = document.getElementById('net-status'); if(!el) return;
    const on = navigator.onLine; el.textContent = on?'Online':'Offline';
    el.classList.toggle('online', on); el.classList.toggle('offline', !on);
  };
  const setSWBadge = (text) => { const el = document.getElementById('sw-status'); if (el) el.textContent = `SW: ${text}`; };

  // tabs + More
  const $ = (s,r=document)=>r.querySelector(s);
  const $all = (s,r=document)=>Array.from(r.querySelectorAll(s));
  function showTab(tab){
    $all('.tab-pane').forEach(p=>{ p.classList.remove('active'); p.hidden = true; });
    const pane = $('#tab-'+tab); if (pane){ pane.hidden=false; pane.classList.add('active'); }
    $all('.tab-btn').forEach(b=> b.classList.toggle('active', b.dataset.tab===tab));
    try { localStorage.setItem('QAM_lastTab', tab); } catch(_){}
    closeMore();
  }
  function openMore(){ const d=$('#more-dialog'); if(d && !d.open) d.showModal(); }
  function closeMore(){ const d=$('#more-dialog'); if(d && d.open) d.close(); }

  function initTabs(){
    $all('.tab-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{ const ttab=btn.dataset.tab; if(ttab==='more'){openMore();return;} showTab(ttab); });
    });
    $('#more-close')?.addEventListener('click', closeMore);
    $all('.more-item').forEach(i=> i.addEventListener('click', (e)=>{ e.preventDefault(); const ttab=i.dataset.tab; if(ttab) showTab(ttab); }));

    let last='quotes'; try { const s=localStorage.getItem('QAM_lastTab'); if(s) last=s; } catch(_){}
    showTab(last);
  }

  // Force update
  async function forceUpdate(){
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k=>caches.delete(k)));
      }
      if (navigator.serviceWorker?.controller) navigator.serviceWorker.controller.postMessage({type:'SKIP_WAITING'});
    } catch(_) {}
    location.reload();
  }
  function initForceUpdate(){ document.getElementById('force-update')?.addEventListener('click', forceUpdate); }

  // boot
  document.addEventListener('DOMContentLoaded', ()=>{
    App.load();
    applyI18n();
    setOnlineStatus();
    addEventListener('online', setOnlineStatus);
    addEventListener('offline', setOnlineStatus);
    initTabs();
    initForceUpdate();
    App.save();

    // (Optional) demo: reflect DB counts in placeholders
    try {
      const DB = window.QAM.DB;
      const counts = {
        quotes: DB.allQuotes().length,
        customers: DB.allCustomers().length,
        vehicles: DB.allVehicles().length,
        presets: DB.allPresets().length
      };
      const ph = document.querySelector('#tab-history .placeholder');
      if (ph) ph.textContent = `Recent quotes (stored: ${counts.quotes}).`;
      const ph2 = document.querySelector('#tab-customers .placeholder');
      if (ph2) ph2.textContent = `Customer list (stored: ${counts.customers}).`;
      const ph3 = document.querySelector('#tab-presets .placeholder');
      if (ph3) ph3.textContent = `Your saved presets (stored: ${counts.presets}).`;
    } catch(_) {}
  });

  // service worker
  if ('serviceWorker' in navigator){
    window.addEventListener('load', async ()=>{
      try {
        const reg = await navigator.serviceWorker.register('./service-worker.js');
        setSWBadge(reg.active ? 'registered' : 'installing');
        navigator.serviceWorker.addEventListener('controllerchange', ()=> setSWBadge('updated'));
      } catch(e){ setSWBadge('error'); }
    });
  } else setSWBadge('n/a');
})();