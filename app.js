(() => {
  // ============================
  // App state (persisted)
  // ============================
  const App = {
    version: '0.3.1-skeleton-i18n+migrations',
    plan: 'lite',           // 'lite' | 'pro' (dev-only toggle in Settings)
    role: 'tech',           // 'tech' | 'sa' | 'owner'
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

  // ============================
  // i18n
  // ============================
  const STRINGS = {
    en: {
      'app.title':'Quote AutoMate',
      'tabs.quotes':'Quotes','tabs.history':'History','tabs.customers':'Customers',
      'tabs.presets':'Presets','tabs.analytics':'Analytics','tabs.more':'More',
      'more.title':'More','more.settings':'Settings','more.business':'Business Info',
      'more.resources':'Resources','more.forceUpdate':'Force Update (clear cache & reload)',
      'more.close':'Close',
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
      'app.title':'Quote AutoMate',
      'tabs.quotes':'Cotizaciones','tabs.history':'Historial','tabs.customers':'Clientes',
      'tabs.presets':'Preajustes','tabs.analytics':'Análisis','tabs.more':'Más',
      'more.title':'Más','more.settings':'Ajustes','more.business':'Información del negocio',
      'more.resources':'Recursos','more.forceUpdate':'Forzar actualización (borrar caché y recargar)',
      'more.close':'Cerrar',
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
      const el = document.getElementById(id); if (el) el.setAttribute('aria-label', t(key));
    });

    const ph = {
      quotes:'ph.quotes',history:'ph.history',customers:'ph.customers',
      presets:'ph.presets',analytics:'ph.analytics',settings:'ph.settings',
      business:'ph.business',resources:'ph.resources'
    };
    Object.entries(ph).forEach(([pane,key])=>{
      const el = document.querySelector('#tab-'+pane);
      if (el && !el.dataset.phMounted){
        const block = document.createElement('div');
        block.className = 'placeholder'; block.textContent = t(key);
        el.appendChild(block); el.dataset.phMounted='1';
      } else if (el){
        const p = el.querySelector('.placeholder'); if (p) p.textContent = t(key);
      }
    });
  }

  // ============================
  // Format helpers
  // ============================
  const fmt = {
    money(v){
      try{
        return new Intl.NumberFormat(App.currency.locale,{
          style:'currency',currency:App.currency.code,maximumFractionDigits:2
        }).format(v||0);
      }catch(_){ return `${App.currency.symbol}${(v||0).toFixed(2)}`;}
    },
    number(v){ try{ return new Intl.NumberFormat(App.currency.locale).format(v||0); }catch(_){ return String(v??0); } },
    date(d){ try{ const dt=d instanceof Date?d:new Date(d);
      return new Intl.DateTimeFormat(App.currency.locale,{year:'numeric',month:'short',day:'2-digit'}).format(dt);
    }catch(_){ return String(d);} }
  };

  // ============================
  // IndexedDB with migrations
  // ============================
  const DB_NAME = 'QAM_DB';
  // Increment this when schema changes; add a migration step below.
  const DB_VERSION = 3;

  // Migration steps. Each runs once when upgrading from a lower version.
  const MIGRATIONS = {
    1(upgradeDB){
      // Initial stores
      const quotes = upgradeDB.createObjectStore('quotes',{ keyPath:'id' });
      quotes.createIndex('by_customer','customerId');
      quotes.createIndex('by_date','createdAt');

      const customers = upgradeDB.createObjectStore('customers',{ keyPath:'id' });
      customers.createIndex('by_name','name');

      const vehicles = upgradeDB.createObjectStore('vehicles',{ keyPath:'id' });
      vehicles.createIndex('by_vin','vin',{ unique:false });

      const presets = upgradeDB.createObjectStore('presets',{ keyPath:'id' });
      presets.createIndex('by_name','name');

      upgradeDB.createObjectStore('meta',{ keyPath:'key' });
    },
    2(upgradeDB){
      // Example: add an index we might want later (safe to re-create if missing)
      const quotes = upgradeDB.objectStore('quotes');
      if (![...quotes.indexNames].includes('by_status')){
        quotes.createIndex('by_status','status');
      }
    },
    3(upgradeDB){
      // Example: prepare for mileage field later (no schema change required now).
      // Kept as a placeholder to prove versioning works.
    }
  };

  function openDB(){
    return new Promise((resolve, reject)=>{
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e)=>{
        const db = req.result;
        const oldV = e.oldVersion || 0;
        for (let v = oldV + 1; v <= DB_VERSION; v++){
          const step = MIGRATIONS[v];
          if (typeof step === 'function') step(db);
        }
      };
      req.onsuccess = ()=> resolve(req.result);
      req.onerror = ()=> reject(req.error);
    });
  }

  // Small wrapper with the operations we need now
  const DB = {
    db:null,
    async init(){ if (!this.db) this.db = await openDB(); return this.db; },
    async countAll(){
      const db = await this.init();
      const stores = ['quotes','customers','vehicles','presets'];
      const tx = db.transaction(stores,'readonly');
      const out = {};
      await Promise.all(stores.map(s=>new Promise((res,rej)=>{
        const req = tx.objectStore(s).count();
        req.onsuccess = ()=>{ out[s]=req.result; res(); };
        req.onerror = ()=> rej(req.error);
      })));
      return out;
    },
    async clearAll(){
      const db = await this.init();
      const tx = db.transaction(['quotes','customers','vehicles','presets'],'readwrite');
      ['quotes','customers','vehicles','presets'].forEach(s=>tx.objectStore(s).clear());
      return new Promise((res,rej)=>{ tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error); });
    },
    async seed(n=2){
      const db = await this.init();
      const now = Date.now();
      const tx = db.transaction(['quotes','customers','vehicles','presets'],'readwrite');
      const q = tx.objectStore('quotes'), c = tx.objectStore('customers'),
            v = tx.objectStore('vehicles'), p = tx.objectStore('presets');
      for (let i=0;i<n;i++){
        const id = crypto.randomUUID();
        const custId = crypto.randomUUID();
        const vehId = crypto.randomUUID();
        c.put({ id:custId, name:`Customer ${Math.floor(Math.random()*1000)}`, phone:'', email:'' });
        v.put({ id:vehId, vin:'', year:2020, make:'Demo', model:'Unit', plate:'' });
        q.put({ id, customerId:custId, vehicleId:vehId, createdAt: now - i*86400000, status:'draft', total: Math.round(Math.random()*800)/1 });
        p.put({ id: crypto.randomUUID(), name:`Preset ${Math.floor(Math.random()*100)}`, items:[] });
      }
      return new Promise((res,rej)=>{ tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error); });
    }
  };

  // expose for future tabs
  window.QAM = { App, t, fmt, DB };

  // ============================
  // Net + SW badge
  // ============================
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

  // ============================
  // Tabs + More (dialog)
  // ============================
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  function showTab(tab){
    $$('.tab-pane').forEach(p=>{ p.classList.remove('active'); p.hidden = true; });
    const pane = $('#tab-'+tab);
    if (pane){ pane.hidden=false; pane.classList.add('active'); }
    $$('.tab-btn').forEach(b=> b.classList.toggle('active', b.dataset.tab===tab));
    try{ localStorage.setItem('QAM_lastTab', tab); }catch(_){}
    closeMore();
  }
  function openMore(){ const d=$('#more-dialog'); if(d && !d.open) d.showModal(); }
  function closeMore(){ const d=$('#more-dialog'); if(d && d.open) d.close(); }

  function initTabs(){
    $$('.tab-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const t = btn.dataset.tab;
        if (t==='more'){ openMore(); return; }
        showTab(t);
      }, {passive:true});
    });
    $('#more-close')?.addEventListener('click', closeMore);
    $$('.more-item').forEach(item=>{
      item.addEventListener('click', (e)=>{
        e.preventDefault();
        const t=item.dataset.tab; if (t) showTab(t);
      });
    });
    let last='quotes';
    try{ const s=localStorage.getItem('QAM_lastTab'); if (s) last=s; }catch(_){}
    showTab(last);
  }

  // ============================
  // Force update (cache-bust)
  // ============================
  async function forceUpdate(){
    try{
      if ('caches' in window){
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if (navigator.serviceWorker?.controller){
        navigator.serviceWorker.controller.postMessage({type:'SKIP_WAITING'});
      }
    }catch(_){}
    location.reload();
  }
  function initForceUpdate(){ $('#force-update')?.addEventListener('click', forceUpdate); }

  // ============================
  // Settings panel (dev only bits)
  // ============================
  function mountSettings(){
    const el = document.getElementById('tab-settings'); if (!el || el.dataset.mounted) return;
    el.dataset.mounted = '1';
    el.innerHTML = `
      <div class="placeholder" style="border-style:solid">
        <h3>Settings</h3>
        <div><strong>Language</strong>
          <select id="langSel">
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>
        <div style="margin-top:8px"><strong>Currency</strong>
          <div>Code <input id="curCode" value="${App.currency.code}" size="6"/></div>
          <div>Symbol <input id="curSym" value="${App.currency.symbol}" size="4"/></div>
          <div>Locale <input id="curLoc" value="${App.currency.locale}" size="10"/></div>
        </div>
        <div style="margin-top:12px"><strong>Access (dev only)</strong>
          <div>Plan:
            <label><input type="radio" name="plan" value="lite" ${App.plan==='lite'?'checked':''}/> Lite</label>
            <label><input type="radio" name="plan" value="pro"  ${App.plan==='pro'?'checked':''}/> Pro</label>
          </div>
          <div>Role:
            <label><input type="radio" name="role" value="tech"   ${App.role==='tech'?'checked':''}/> Technician</label>
            <label><input type="radio" name="role" value="sa"     ${App.role==='sa'?'checked':''}/> Service Advisor</label>
            <label><input type="radio" name="role" value="owner"  ${App.role==='owner'?'checked':''}/> Owner</label>
          </div>
          <button id="savePrefs">Save</button>
        </div>
        <div style="margin-top:12px"><strong>Data (dev only)</strong>
          <button id="seedBtn">Seed demo data</button>
          <button id="wipeBtn" style="background:#6b1f28">Wipe all data</button>
          <div id="countsLine" style="margin-top:6px"></div>
        </div>
      </div>
    `;
    // set selects
    el.querySelector('#langSel').value = App.lang;

    el.querySelector('#savePrefs').addEventListener('click', async ()=>{
      App.lang = el.querySelector('#langSel').value;
      App.currency.code   = el.querySelector('#curCode').value.trim().toUpperCase();
      App.currency.symbol = el.querySelector('#curSym').value;
      App.currency.locale = el.querySelector('#curLoc').value.trim() || 'en-US';
      const plan = el.querySelector('input[name="plan"]:checked')?.value;
      const role = el.querySelector('input[name="role"]:checked')?.value;
      if (plan) App.plan = plan;
      if (role) App.role = role;
      App.save();
      applyI18n();
      alert('Saved.');
      updateCounts();
    });

    el.querySelector('#seedBtn').addEventListener('click', async ()=>{
      await DB.seed(2);
      updateCounts();
    });
    el.querySelector('#wipeBtn').addEventListener('click', async ()=>{
      await DB.clearAll();
      updateCounts();
    });

    async function updateCounts(){
      const c = await DB.countAll();
      el.querySelector('#countsLine').textContent =
        `Counts — Quotes: ${c.quotes||0}, Customers: ${c.customers||0}, Vehicles: ${c.vehicles||0}, Presets: ${c.presets||0}`;
    }
    updateCounts();
  }

  // ============================
  // Boot
  // ============================
  document.addEventListener('DOMContentLoaded', async ()=>{
    App.load();
    applyI18n();
    initNet();
    initTabs();
    initForceUpdate();
    mountSettings();
    App.save();
    // Warm DB to ensure migrations applied on first load
    try { await DB.init(); } catch(_){}
  });

  // ============================
  // SW registration
  // ============================
  if ('serviceWorker' in navigator){
    window.addEventListener('load', async ()=>{
      try{
        const reg = await navigator.serviceWorker.register('./service-worker.js');
        setSWBadge(reg.active ? 'registered' : 'installing');
        navigator.serviceWorker.addEventListener('controllerchange', ()=> setSWBadge('updated'));
      }catch(e){ setSWBadge('error'); }
    });
  } else {
    setSWBadge('n/a');
  }
})();