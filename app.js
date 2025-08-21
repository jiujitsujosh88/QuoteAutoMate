(() => {
  // ---------------------------------
  // Minimal App State & Utilities
  // ---------------------------------
  const App = {
    version: '0.4.0-models',
    plan: 'lite',            // 'lite' | 'pro'  (dev toggle; real paywall later)
    role: 'tech',            // 'tech' | 'sa' | 'owner'
    lang: 'en',
    currency: { code: 'USD', symbol: '$', locale: 'en-US' },

    load(){
      try {
        const raw = localStorage.getItem('QAM_STATE');
        if (raw){
          const s = JSON.parse(raw);
          Object.assign(this, s);
        }
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

  // Tiny uid helper (sortable)
  function uid() {
    const t = Date.now().toString(36);
    const r = Math.random().toString(36).slice(2, 8);
    return `${t}-${r}`;
  }

  // ---------------------------------
  // i18n Shell
  // ---------------------------------
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
      'ph.resources': 'Employees, sublets, suppliers.',

      'settings.title': 'Settings',
      'settings.section.app': 'App Preferences',
      'settings.lang': 'Language',
      'settings.currency': 'Currency',
      'settings.currency.code': 'Code',
      'settings.currency.symbol': 'Symbol',
      'settings.currency.locale': 'Locale',
      'settings.save': 'Save',

      'settings.section.access': 'Access (dev only)',
      'settings.plan': 'Plan',
      'settings.plan.lite': 'Lite',
      'settings.plan.pro': 'Pro',
      'settings.role': 'Role',
      'settings.role.tech': 'Technician',
      'settings.role.sa': 'Service Advisor',
      'settings.role.owner': 'Owner',

      'locked.hint': 'This is available in Pro.',

      // Step D additions
      'settings.section.devdata': 'Data (dev only)',
      'settings.seed': 'Seed demo data',
      'settings.wipe': 'Wipe all data',
      'settings.counts': 'Counts — Quotes: {q}, Customers: {c}, Vehicles: {v}, Presets: {p}'
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
      'ph.resources': 'Empleados, subcontratos, proveedores.',

      'settings.title': 'Ajustes',
      'settings.section.app': 'Preferencias de la App',
      'settings.lang': 'Idioma',
      'settings.currency': 'Moneda',
      'settings.currency.code': 'Código',
      'settings.currency.symbol': 'Símbolo',
      'settings.currency.locale': 'Configuración regional',
      'settings.save': 'Guardar',

      'settings.section.access': 'Acceso (solo dev)',
      'settings.plan': 'Plan',
      'settings.plan.lite': 'Lite',
      'settings.plan.pro': 'Pro',
      'settings.role': 'Rol',
      'settings.role.tech': 'Técnico',
      'settings.role.sa': 'Asesor de Servicio',
      'settings.role.owner': 'Dueño',

      'locked.hint': 'Disponible en Pro.',

      'settings.section.devdata': 'Datos (solo dev)',
      'settings.seed': 'Cargar datos demo',
      'settings.wipe': 'Borrar todos los datos',
      'settings.counts': 'Conteos — Cotizaciones: {q}, Clientes: {c}, Vehículos: {v}, Preajustes: {p}'
    }
  };

  const t = (key) => {
    const dict = STRINGS[App.lang] || STRINGS.en;
    return dict[key] || STRINGS.en[key] || key;
  };

  function applyI18n(){
    // static labels
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const k = el.getAttribute('data-i18n');
      el.textContent = t(k);
    });

    // aria-label chips
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
      quotes: 'ph.quotes',
      history:'ph.history',
      customers:'ph.customers',
      presets:'ph.presets',
      analytics:'ph.analytics',
      settings:'ph.settings',
      business:'ph.business',
      resources:'ph.resources'
    };
    Object.entries(ph).forEach(([pane, key])=>{
      const el = document.querySelector('#tab-'+pane);
      if (!el) return;
      let p = el.querySelector('.placeholder');
      if (!p){
        p = document.createElement('div');
        p.className = 'placeholder';
        el.appendChild(p);
      }
      p.textContent = t(key);
    });
  }

  // ---------------------------------
  // Format Helpers
  // ---------------------------------
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

  // Expose globally
  window.QAM = window.QAM || {};
  Object.assign(window.QAM, { App, t, fmt });

  // ---------------------------------
  // Storage Layer: IndexedDB + fallback
  // ---------------------------------
  const STORES = ['quotes','customers','vehicles','presets'];

  const DB = {
    db: null,
    name: 'QAM_DB',
    version: 1,

    async init(){
      if (!('indexedDB' in window)) {
        console.warn('IndexedDB not available; using localStorage fallback.');
        this.db = null;
        return;
      }
      await new Promise((resolve, reject)=>{
        const req = indexedDB.open(this.name, this.version);
        req.onupgradeneeded = () => {
          const db = req.result;
          STORES.forEach(s=>{
            if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' });
          });
        };
        req.onsuccess = () => { this.db = req.result; resolve(); };
        req.onerror = () => { console.warn('IDB error, falling back to LS', req.error); this.db = null; resolve(); };
      });
    },

    _tx(store, mode='readonly'){
      const tx = this.db.transaction(store, mode);
      return { tx, os: tx.objectStore(store) };
    },

    async put(store, value){
      if (!value.id) value.id = uid();
      if (!this.db) return this._lsPut(store, value);
      return new Promise((res, rej)=>{
        const { os } = this._tx(store, 'readwrite');
        const req = os.put(value);
        req.onsuccess = () => res(value);
        req.onerror = () => rej(req.error);
      });
    },
    async get(store, id){
      if (!this.db) return this._lsGet(store, id);
      return new Promise((res, rej)=>{
        const { os } = this._tx(store);
        const req = os.get(id);
        req.onsuccess = () => res(req.result || null);
        req.onerror = () => rej(req.error);
      });
    },
    async list(store){
      if (!this.db) return this._lsList(store);
      return new Promise((res, rej)=>{
        const { os } = this._tx(store);
        const req = os.getAll();
        req.onsuccess = () => res(req.result || []);
        req.onerror = () => rej(req.error);
      });
    },
    async remove(store, id){
      if (!this.db) return this._lsRemove(store, id);
      return new Promise((res, rej)=>{
        const { os } = this._tx(store, 'readwrite');
        const req = os.delete(id);
        req.onsuccess = () => res(true);
        req.onerror = () => rej(req.error);
      });
    },
    async clear(store){
      if (!this.db) return this._lsClear(store);
      return new Promise((res, rej)=>{
        const { os } = this._tx(store, 'readwrite');
        const req = os.clear();
        req.onsuccess = () => res(true);
        req.onerror = () => rej(req.error);
      });
    },

    // --- localStorage fallback ---
    _lsKey(store){ return `QAM_LS_${store}`; },
    _lsList(store){
      try { return JSON.parse(localStorage.getItem(this._lsKey(store))||'[]'); }
      catch(_){ return []; }
    },
    async _lsPut(store, val){
      const arr = this._lsList(store);
      const idx = arr.findIndex(x=>x.id===val.id);
      if (idx>=0) arr[idx] = val; else arr.push(val);
      localStorage.setItem(this._lsKey(store), JSON.stringify(arr));
      return val;
    },
    async _lsGet(store, id){
      const arr = this._lsList(store);
      return arr.find(x=>x.id===id) || null;
    },
    async _lsRemove(store, id){
      const arr = this._lsList(store).filter(x=>x.id!==id);
      localStorage.setItem(this._lsKey(store), JSON.stringify(arr));
      return true;
    },
    async _lsClear(store){
      localStorage.removeItem(this._lsKey(store));
      return true;
    }
  };

  // expose DB
  window.QAM.DB = DB;

  // ---------------------------------
  // Models (factories + light validators)
  // ---------------------------------
  const Models = {
    Quote(data={}){
      const now = Date.now();
      return {
        id: data.id || uid(),
        createdAt: data.createdAt || now,
        updatedAt: now,
        title: data.title || '',          // "Job Title" (you asked for earlier)
        ro: data.ro || '',                // RO / ticket #
        customerId: data.customerId || null,
        vehicleId: data.vehicleId || null,
        sold: !!data.sold,
        sent: !!data.sent,
        currency: data.currency || App.currency, // snapshot at time of quote
        totals: data.totals || { subtotal:0, tax:0, grand:0 },
        // bare lines; richer schema will come during Quotes tab build
        labor: Array.isArray(data.labor) ? data.labor : [],
        parts: Array.isArray(data.parts) ? data.parts : [],
        notes: data.notes || ''
      };
    },
    Customer(data={}){
      return {
        id: data.id || uid(),
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        notes: data.notes || '',
        createdAt: data.createdAt || Date.now()
      };
    },
    Vehicle(data={}){
      return {
        id: data.id || uid(),
        customerId: data.customerId || null,
        year: data.year || '',
        make: data.make || '',
        model: data.model || '',
        vin: data.vin || '',
        plate: data.plate || '',
        // mileage to add later
        createdAt: data.createdAt || Date.now()
      };
    },
    Preset(data={}){
      return {
        id: data.id || uid(),
        name: data.name || '',
        // for parsing & apply-to-ticket later:
        labor: Array.isArray(data.labor) ? data.labor : [],
        parts: Array.isArray(data.parts) ? data.parts : [],
        vehicleFilter: data.vehicleFilter || null, // e.g., {make:'Audi'} (future)
        createdAt: data.createdAt || Date.now()
      };
    }
  };
  window.QAM.Models = Models;

  // Simple Repository helpers (CRUD)
  const Repo = {
    async upsertQuote(q){ q.updatedAt = Date.now(); return DB.put('quotes', q); },
    async getQuote(id){ return DB.get('quotes', id); },
    async listQuotes(){ return DB.list('quotes'); },
    async removeQuote(id){ return DB.remove('quotes', id); },

    async upsertCustomer(c){ return DB.put('customers', c); },
    async getCustomer(id){ return DB.get('customers', id); },
    async listCustomers(){ return DB.list('customers'); },
    async removeCustomer(id){ return DB.remove('customers', id); },

    async upsertVehicle(v){ return DB.put('vehicles', v); },
    async getVehicle(id){ return DB.get('vehicles', id); },
    async listVehicles(){ return DB.list('vehicles'); },
    async removeVehicle(id){ return DB.remove('vehicles', id); },

    async upsertPreset(p){ return DB.put('presets', p); },
    async getPreset(id){ return DB.get('presets', id); },
    async listPresets(){ return DB.list('presets'); },
    async removePreset(id){ return DB.remove('presets', id); },

    async wipeAll(){
      await Promise.all(STORES.map(s => DB.clear(s)));
    }
  };
  window.QAM.Repo = Repo;

  // ---------------------------------
  // Online/Offline + SW badge
  // ---------------------------------
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

  // ---------------------------------
  // Tabs + More (dialog)
  // ---------------------------------
  const $ = (sel, root=document) => root.querySelector(sel);
  const $all = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function showTab(tab){
    $all('.tab-pane').forEach(p => { p.classList.remove('active'); p.hidden = true; });
    const pane = $('#tab-' + tab);
    if (pane){ pane.hidden = false; pane.classList.add('active'); }
    $all('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
    try { localStorage.setItem('QAM_lastTab', tab); } catch(_) {}
    closeMore();
    if (tab === 'settings') renderSettings();
  }
  function openMore(){
    const dlg = $('#more-dialog'); if (dlg && !dlg.open) dlg.showModal();
  }
  function closeMore(){
    const dlg = $('#more-dialog'); if (dlg && dlg.open) dlg.close();
  }

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

  // ---------------------------------
  // Gating (Lite vs Pro) + Role Hints
  // ---------------------------------
  const Gate = {
    isPro(){ return App.plan === 'pro'; },
    canAdvancedAnalytics(){ return this.isPro(); },
    canBusinessInfo(){ return this.isPro(); },
    canResources(){ return this.isPro(); },
    roleHint(){
      switch(App.role){
        case 'tech': return '(Tech view)';
        case 'sa': return '(SA view)';
        case 'owner': return '(Owner view)';
        default: return '';
      }
    }
  };
  window.QAM.Gate = Gate;

  function applyGates(){
    const biz = $('#tab-business'); const res = $('#tab-resources');
    [biz,res].forEach(el=>{
      if (!el) return;
      const ph = el.querySelector('.placeholder') || el.appendChild(document.createElement('div'));
      ph.className = 'placeholder';
      const base = (el.id === 'tab-business') ? t('ph.business') : t('ph.resources');
      if (!Gate.isPro()){
        el.classList.add('locked');
        ph.innerHTML = `${base} <br><small class="hint">${t('locked.hint')}</small>`;
      } else {
        el.classList.remove('locked');
        ph.textContent = base;
      }
    });

    ['quotes','history','customers','presets','analytics'].forEach(id=>{
      const el = $('#tab-'+id);
      if (!el) return;
      el.setAttribute('aria-label', `${el.getAttribute('aria-label')||id} ${Gate.roleHint()}`);
    });
  }

  // ---------------------------------
  // Settings Renderer (with Dev Data tools)
  // ---------------------------------
  function renderSettings(){
    const root = $('#tab-settings'); if (!root) return;

    if (!root.dataset.built){
      root.innerHTML = `
        <div style="display:grid;gap:12px;max-width:720px">
          <h3 data-i18n="settings.title">Settings</h3>

          <section style="border:1px solid var(--border);border-radius:12px;padding:12px;background:#101521">
            <div style="font-weight:700;margin-bottom:6px" data-i18n="settings.section.app">App Preferences</div>
            <div style="display:grid;gap:8px">
              <label>
                <span data-i18n="settings.lang">Language</span><br>
                <select id="set-lang" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border);background:#0f131d;color:var(--text)">
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </label>

              <fieldset style="border:1px dashed var(--border);border-radius:8px;padding:10px">
                <legend style="opacity:.8" data-i18n="settings.currency">Currency</legend>
                <div style="display:grid;grid-template-columns:1fr 1fr 1.2fr;gap:8px">
                  <label>
                    <small data-i18n="settings.currency.code">Code</small>
                    <input id="cur-code" type="text" inputmode="latin" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border);background:#0f131d;color:var(--text)" />
                  </label>
                  <label>
                    <small data-i18n="settings.currency.symbol">Symbol</small>
                    <input id="cur-symbol" type="text" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border);background:#0f131d;color:var(--text)" />
                  </label>
                  <label>
                    <small data-i18n="settings.currency.locale">Locale</small>
                    <input id="cur-locale" type="text" placeholder="e.g., en-US, de-DE" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border);background:#0f131d;color:var(--text)" />
                  </label>
                </div>
              </fieldset>
            </div>
          </section>

          <section style="border:1px solid var(--border);border-radius:12px;padding:12px;background:#101521">
            <div style="font-weight:700;margin-bottom:6px" data-i18n="settings.section.access">Access (dev only)</div>
            <div style="display:grid;gap:10px">
              <div>
                <div style="opacity:.8;margin-bottom:4px" data-i18n="settings.plan">Plan</div>
                <label style="margin-right:12px">
                  <input type="radio" name="plan" value="lite"> <span data-i18n="settings.plan.lite">Lite</span>
                </label>
                <label>
                  <input type="radio" name="plan" value="pro"> <span data-i18n="settings.plan.pro">Pro</span>
                </label>
              </div>

              <div>
                <div style="opacity:.8;margin-bottom:4px" data-i18n="settings.role">Role</div>
                <label style="margin-right:12px">
                  <input type="radio" name="role" value="tech"> <span data-i18n="settings.role.tech">Technician</span>
                </label>
                <label style="margin-right:12px">
                  <input type="radio" name="role" value="sa"> <span data-i18n="settings.role.sa">Service Advisor</span>
                </label>
                <label>
                  <input type="radio" name="role" value="owner"> <span data-i18n="settings.role.owner">Owner</span>
                </label>
              </div>

              <button id="settings-save" style="padding:10px;border:1px solid var(--border);border-radius:10px;background:#182034;color:var(--text)" data-i18n="settings.save">Save</button>
            </div>
          </section>

          <section style="border:1px solid var(--border);border-radius:12px;padding:12px;background:#101521">
            <div style="font-weight:700;margin-bottom:6px" data-i18n="settings.section.devdata">Data (dev only)</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button id="btn-seed" style="padding:10px;border:1px solid var(--border);border-radius:10px;background:#182034;color:var(--text)" data-i18n="settings.seed">Seed demo data</button>
              <button id="btn-wipe" style="padding:10px;border:1px solid var(--border);border-radius:10px;background:#3a1020;color:#ffd3e0" data-i18n="settings.wipe">Wipe all data</button>
            </div>
            <div id="data-counts" style="margin-top:8px;opacity:.85"></div>
          </section>
        </div>
      `;
      root.dataset.built = '1';

      // Wire Save
      $('#settings-save')?.addEventListener('click', ()=>{
        const langSel = $('#set-lang');
        const code = $('#cur-code'), sym = $('#cur-symbol'), loc = $('#cur-locale');
        const planVal = (document.querySelector('input[name="plan"]:checked')||{}).value || App.plan;
        const roleVal = (document.querySelector('input[name="role"]:checked')||{}).value || App.role;

        App.lang = langSel?.value || App.lang;
        App.currency = {
          code: code?.value?.trim() || App.currency.code,
          symbol: sym?.value || App.currency.symbol,
          locale: loc?.value?.trim() || App.currency.locale
        };
        App.plan = planVal;
        App.role = roleVal;

        App.save();
        applyI18n();
        applyGates();
        alert('Saved.');
        updateCounts();
      });

      // Dev data buttons
      $('#btn-seed')?.addEventListener('click', async ()=>{
        await seedDemo();
        updateCounts();
        alert('Seeded demo data.');
      });
      $('#btn-wipe')?.addEventListener('click', async ()=>{
        if (!confirm('Wipe ALL data?')) return;
        await Repo.wipeAll();
        updateCounts();
        alert('Data cleared.');
      });
    }

    // Update values on open
    const langSel = $('#set-lang'); if (langSel) langSel.value = App.lang;
    const code = $('#cur-code'), sym = $('#cur-symbol'), loc = $('#cur-locale');
    if (code) code.value = App.currency.code;
    if (sym) sym.value = App.currency.symbol;
    if (loc) loc.value = App.currency.locale;

    const planRadio = document.querySelector(`input[name="plan"][value="${App.plan}"]`);
    const roleRadio = document.querySelector(`input[name="role"][value="${App.role}"]`);
    if (planRadio) planRadio.checked = true;
    if (roleRadio) roleRadio.checked = true;

    updateCounts();

    async function updateCounts(){
      const [q,c,v,p] = await Promise.all([
        Repo.listQuotes(), Repo.listCustomers(), Repo.listVehicles(), Repo.listPresets()
      ]);
      const el = $('#data-counts');
      if (el){
        const msg = t('settings.counts')
          .replace('{q}', q.length).replace('{c}', c.length)
          .replace('{v}', v.length).replace('{p}', p.length);
        el.textContent = msg;
      }
    }
  }

  // Demo seeder
  async function seedDemo(){
    // Customers
    const c1 = Models.Customer({ name:'Alex Rivera', phone:'555-1234', email:'alex@example.com' });
    const c2 = Models.Customer({ name:'Morgan Lee', phone:'555-8888', email:'morgan@example.com' });
    await Promise.all([Repo.upsertCustomer(c1), Repo.upsertCustomer(c2)]);

    // Vehicles
    const v1 = Models.Vehicle({ customerId: c1.id, year:'2018', make:'Audi', model:'A4', vin:'WAUZZZF58JN000001', plate:'TX-7AB123' });
    const v2 = Models.Vehicle({ customerId: c2.id, year:'2015', make:'BMW', model:'328i', vin:'WBA3A5C59FF000002', plate:'TX-9XY456' });
    await Promise.all([Repo.upsertVehicle(v1), Repo.upsertVehicle(v2)]);

    // Preset
    const p1 = Models.Preset({
      name: 'Oil Change (Base)',
      labor: [{ name:'Oil change', hours:1.0 }],
      parts: [{ name:'5qt synthetic', cost:45 }, { name:'Filter', cost:12 }]
    });
    await Repo.upsertPreset(p1);

    // Quotes
    const q1 = Models.Quote({
      title: 'Front brakes',
      ro: 'Q-1001',
      customerId: c1.id,
      vehicleId: v1.id,
      sold: false,
      totals: { subtotal: 350, tax: 28.88, grand: 378.88 },
      labor: [{ name:'Front brake job', hours:2.3, rate:120, price:276 }],
      parts: [{ name:'Pads', cost:75, price:110 }, { name:'Hardware', cost:15, price:20 }]
    });
    const q2 = Models.Quote({
      title: 'Service A',
      ro: 'Q-1002',
      customerId: c2.id,
      vehicleId: v2.id,
      sold: true,
      totals: { subtotal: 420, tax: 34.65, grand: 454.65 },
      labor: [{ name:'Service A', hours:1.0, rate:120, price:120 }],
      parts: [{ name:'Oil & filter', cost:55, price:90 }]
    });
    await Promise.all([Repo.upsertQuote(q1), Repo.upsertQuote(q2)]);
  }

  // ---------------------------------
  // Force Update (cache bust)
  // ---------------------------------
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

  // ---------------------------------
  // Boot
  // ---------------------------------
  document.addEventListener('DOMContentLoaded', async () => {
    App.load();
    applyI18n();
    initNet();
    initForceUpdate();

    await DB.init();                  // open IndexedDB (or LS fallback)
    window.QAM.readyDB = true;

    initTabs();                       // tabs + more (after DB ready)
    applyGates();
    App.save();
  });

  // ---------------------------------
  // Service Worker registration
  // ---------------------------------
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