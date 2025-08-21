(() => {
  // ---------------------------------
  // Minimal App State & Utilities
  // ---------------------------------
  const App = {
    version: '0.3.1-roles',
    plan: 'lite',            // 'lite' | 'pro'  (dev toggle; real paywall later)
    role: 'tech',            // 'tech' | 'sa' | 'owner'
    lang: 'en',              // ISO language
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

      'locked.hint': 'This is available in Pro.'
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

      'locked.hint': 'Disponible en Pro.'
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

  // Expose for future tabs
  window.QAM = window.QAM || {};
  Object.assign(window.QAM, { App, t, fmt });

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
    // If settings shown, re-render its dynamic controls
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
    // feature flags scaffold (expand later as we add real features)
    isPro(){ return App.plan === 'pro'; },
    canAdvancedAnalytics(){ return this.isPro(); },
    canBusinessInfo(){ return this.isPro(); },
    canResources(){ return this.isPro(); },
    // by-role hints (nothing blocked yet; later can refine)
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
    // Lock “Business Info” and “Resources” placeholders in Lite
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

    // Add a light role-hint to tab headers (chips)
    ['quotes','history','customers','presets','analytics'].forEach(id=>{
      const el = $('#tab-'+id);
      if (!el) return;
      el.setAttribute('aria-label', `${el.getAttribute('aria-label')||id} ${Gate.roleHint()}`);
    });
  }

  // ---------------------------------
  // Settings Renderer (dev-only selectors)
  // ---------------------------------
  function renderSettings(){
    const root = $('#tab-settings'); if (!root) return;

    // Build settings UI only once; then update values on show
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
        alert('Saved.'); // simple confirmation for now
      });
    }

    // Update control values from state each time Settings is opened
    const langSel = $('#set-lang'); if (langSel) langSel.value = App.lang;
    const code = $('#cur-code'), sym = $('#cur-symbol'), loc = $('#cur-locale');
    if (code) code.value = App.currency.code;
    if (sym) sym.value = App.currency.symbol;
    if (loc) loc.value = App.currency.locale;

    const planRadio = document.querySelector(`input[name="plan"][value="${App.plan}"]`);
    const roleRadio = document.querySelector(`input[name="role"][value="${App.role}"]`);
    if (planRadio) planRadio.checked = true;
    if (roleRadio) roleRadio.checked = true;
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
    // wired from HTML buttons already; keep helper available if needed
    document.getElementById('force-update')?.addEventListener('click', forceUpdate);
  }

  // ---------------------------------
  // Boot
  // ---------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    App.load();
    applyI18n();
    initNet();
    initTabs();
    initForceUpdate();
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