(()=> {
  // -----------------------------
  // App State
  // -----------------------------
  const App = {
    version: '1.0.0-baseline',
    plan: 'lite',                 // 'lite' | 'pro' (dev only; will be license-gated later)
    role: 'tech',                 // 'tech' | 'sa' | 'owner'
    lang: 'en',                   // 'en' | 'es' (extendable)
    currency: { code:'USD', symbol:'$', locale:'en-US' },

    load(){
      try {
        const raw = localStorage.getItem('QAM_STATE');
        if (raw) Object.assign(this, JSON.parse(raw));
      } catch(_) {}
    },
    save(){
      try {
        localStorage.setItem('QAM_STATE', JSON.stringify({
          version:this.version, plan:this.plan, role:this.role, lang:this.lang, currency:this.currency
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
      'tabs.quotes':'Quotes','tabs.history':'History','tabs.customers':'Customers','tabs.presets':'Presets','tabs.analytics':'Analytics',
      'more.title':'More','more.settings':'Settings','more.business':'Business Info','more.resources':'Resources','more.forceUpdate':'Force Update (clear cache & reload)','more.close':'Close',
      'ph.quotes':'Start your quote flow here.',
      'ph.history':'Recent quotes. (Later: quick-add from prior tickets.)',
      'ph.customers':'Customer list & quick search.',
      'ph.presets':'Your saved presets will appear here.',
      'ph.analytics':'KPIs & date-range reports.',
      'ph.settings':'Language, currency, role.',
      'ph.business':'Business name, logo, contact, financial defaults.',
      'ph.resources':'Employees, sublets, suppliers.',

      // Settings form
      'set.lang':'Language','set.plan':'Plan','set.role':'Role','set.currency':'Currency (read-only for now)',
      'set.save':'Save','set.seed':'Seed demo data (+2)','set.clear':'Clear data'
    },
    es: {
      'app.title': 'Quote AutoMate',
      'tabs.quotes':'Cotizaciones','tabs.history':'Historial','tabs.customers':'Clientes','tabs.presets':'Preajustes','tabs.analytics':'Análisis',
      'more.title':'Más','more.settings':'Ajustes','more.business':'Información del negocio','more.resources':'Recursos','more.forceUpdate':'Forzar actualización (borrar caché y recargar)','more.close':'Cerrar',
      'ph.quotes':'Comienza tu flujo de cotización aquí.',
      'ph.history':'Cotizaciones recientes. (Después: añadir rápido desde tickets previos.)',
      'ph.customers':'Lista de clientes y búsqueda rápida.',
      'ph.presets':'Tus preajustes aparecerán aquí.',
      'ph.analytics':'KPIs e informes por rango de fechas.',
      'ph.settings':'Idioma, moneda, rol.',
      'ph.business':'Nombre del negocio, logo, contacto y valores por defecto.',
      'ph.resources':'Empleados, subcontratos, proveedores.',

      'set.lang':'Idioma','set.plan':'Plan','set.role':'Rol','set.currency':'Moneda (solo lectura por ahora)',
      'set.save':'Guardar','set.seed':'Sembrar datos demo (+2)','set.clear':'Borrar datos'
    }
  };
  const t = (k)=> (STRINGS[App.lang]&&STRINGS[App.lang][k]) || STRINGS.en[k] || k;

  function applyI18n(){
    // data-i18n labels
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const k = el.getAttribute('data-i18n');
      el.textContent = t(k);
    });
    // aria for tab headers
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
      quotes:'ph.quotes',history:'ph.history',customers:'ph.customers',presets:'ph.presets',analytics:'ph.analytics',
      settings:'ph.settings',business:'ph.business',resources:'ph.resources'
    };
    Object.entries(ph).forEach(([pane, key])=>{
      const el = document.querySelector('#tab-'+pane);
      if (el && !el.dataset.phMounted){
        const d=document.createElement('div'); d.className='placeholder'; d.textContent=t(key);
        el.appendChild(d); el.dataset.phMounted='1';
      } else if (el){
        const p=el.querySelector('.placeholder'); if (p) p.textContent=t(key);
      }
    });
  }

  // -----------------------------
  // Utilities + DOM helpers
  // -----------------------------
  const $ = (sel, root=document)=> root.querySelector(sel);
  const $$ = (sel, root=document)=> Array.from(root.querySelectorAll(sel));
  const fmt = {
    money(v){ try {return new Intl.NumberFormat(App.currency.locale,{style:'currency',currency:App.currency.code}).format(v||0);} catch(_){return `${App.currency.symbol}${(v||0).toFixed(2)}`;} }
  };
  window.QAM = { App, t, fmt };

  // -----------------------------
  // Tabs + More
  // -----------------------------
  function showTab(tab){
    $$('.tab-pane').forEach(p=>{p.classList.remove('active');p.hidden=true;});
    const pane = $('#tab-'+tab); if (pane){ pane.hidden=false; pane.classList.add('active'); }
    $$('.tab-btn').forEach(btn=>btn.classList.toggle('active', btn.dataset.tab===tab));
    try{ localStorage.setItem('QAM_lastTab', tab);}catch(_){}
    closeMore();
  }
  function openMore(){ const d=$('#more-dialog'); if(d && !d.open) d.showModal(); }
  function closeMore(){ const d=$('#more-dialog'); if(d && d.open) d.close(); }

  function initTabs(){
    $$('.tab-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const tab = btn.dataset.tab;
        if (tab==='more'){ openMore(); return; }
        showTab(tab);
      }, {passive:true});
    });
    $('#more-close')?.addEventListener('click', closeMore);
    $$('.more-item').forEach(item=>{
      item.addEventListener('click',(e)=>{ e.preventDefault(); const tab=item.dataset.tab; if(tab) showTab(tab); });
    });
    let last='quotes'; try{ const saved=localStorage.getItem('QAM_lastTab'); if (saved) last=saved; }catch(_){}
    showTab(last);
  }

  // -----------------------------
  // Network/SW badges
  // -----------------------------
  function setOnlineStatus(){
    const el=$('#net-status'); if(!el) return;
    const online = navigator.onLine;
    el.textContent = online ? 'Online':'Offline';
    el.classList.toggle('online', online);
    el.classList.toggle('offline', !online);
  }
  function setSWBadge(txt){ const el=$('#sw-status'); if(el) el.textContent = `SW: ${txt}`; }

  // -----------------------------
  // Settings (single long scroll; 4 rows)
  // -----------------------------
  function mountSettings(){
    const host = $('#tab-settings'); if(!host) return;
    if(host.dataset.mounted) return;
    host.dataset.mounted='1';

    const wrap = document.createElement('div');
    wrap.className='form';
    wrap.innerHTML = `
      <div class="row">
        <label for="langSel" data-i18n="set.lang">Language</label>
        <select id="langSel">
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>
      <div class="row">
        <label for="planSel" data-i18n="set.plan">Plan</label>
        <select id="planSel">
          <option value="lite">Lite</option>
          <option value="pro">Pro</option>
        </select>
        <div class="note">Dev toggle only (will be license-gated in production).</div>
      </div>
      <div class="row">
        <label for="roleSel" data-i18n="set.role">Role</label>
        <select id="roleSel">
          <option value="tech">Technician</option>
          <option value="sa">Service Advisor</option>
          <option value="owner">Owner</option>
        </select>
      </div>
      <div class="row">
        <label data-i18n="set.currency">Currency (read-only for now)</label>
        <input id="curDisp" type="text" readonly>
      </div>
      <div class="actions">
        <button id="saveBtn" data-i18n="set.save">Save</button>
        <button id="seedBtn" data-i18n="set.seed">Seed demo data (+2)</button>
        <button id="clearBtn" data-i18n="set.clear">Clear data</button>
        <button id="force-update" class="more-update" data-i18n="more.forceUpdate">Force Update (clear cache & reload)</button>
      </div>
    `;
    host.appendChild(wrap);

    // Set current values
    $('#langSel').value = App.lang;
    $('#planSel').value = App.plan;
    $('#roleSel').value = App.role;
    $('#curDisp').value = `${App.currency.code} (${App.currency.symbol}) — ${App.currency.locale}`;

    // Wire actions
    $('#saveBtn').addEventListener('click', ()=>{
      App.lang = $('#langSel').value;
      App.plan = $('#planSel').value;
      App.role = $('#roleSel').value;
      App.save();
      applyI18n();
      alert('Saved.');
    });

    $('#seedBtn').addEventListener('click', ()=>{
      // simple counter demo
      const n = Number(localStorage.getItem('QAM_SEED')||'0')+2;
      localStorage.setItem('QAM_SEED', String(n));
      alert(`Seed count: ${n}`);
    });

    $('#clearBtn').addEventListener('click', async ()=>{
      try{
        localStorage.clear();
        if ('caches' in window){
          const keys = await caches.keys();
          await Promise.all(keys.map(k=>caches.delete(k)));
        }
      }catch(_){}
      location.reload();
    });

    $('#force-update')?.addEventListener('click', forceUpdate);
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

  // -----------------------------
  // Boot
  // -----------------------------
  document.addEventListener('DOMContentLoaded', ()=>{
    App.load();
    applyI18n();
    setOnlineStatus(); addEventListener('online',setOnlineStatus); addEventListener('offline',setOnlineStatus);
    initTabs();
    mountSettings(); // long scroll settings page
    App.save();
  });

  // -----------------------------
  // SW registration
  // -----------------------------
  if ('serviceWorker' in navigator){
    window.addEventListener('load', async ()=>{
      try{
        const reg = await navigator.serviceWorker.register('./service-worker.js');
        setSWBadge(reg.active ? 'registered' : 'installing');
        navigator.serviceWorker.addEventListener('controllerchange', ()=> setSWBadge('updated'));
      }catch(e){
        setSWBadge('error');
      }
    });
  } else {
    setSWBadge('n/a');
  }
})();