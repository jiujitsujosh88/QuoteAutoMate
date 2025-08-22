(()=>{

  /* ------------ App State ------------ */
  const App = {
    version: '0.3.2-i18n-restore',
    plan: 'lite',              // dev toggle only; real gating later
    role: 'tech',
    lang: 'en',
    currency: { code:'USD', symbol:'$', locale:'en-US' },
    load(){
      try{ Object.assign(this, JSON.parse(localStorage.getItem('QAM_STATE')||'{}')); }catch(_){}
      document.documentElement.lang = this.lang || 'en';
    },
    save(){
      try{
        localStorage.setItem('QAM_STATE', JSON.stringify({
          version:this.version, plan:this.plan, role:this.role,
          lang:this.lang, currency:this.currency
        }));
      }catch(_){}
      document.documentElement.lang = this.lang || 'en';
    }
  };

  /* ------------ i18n ------------ */
  const STRINGS = {
    en: {
      'app.title':'Quote AutoMate',
      'tabs.quotes':'Quotes','tabs.history':'History','tabs.customers':'Customers',
      'tabs.presets':'Presets','tabs.analytics':'Analytics','tabs.more':'More',
      'more.title':'More','more.settings':'Settings','more.business':'Business Info',
      'more.resources':'Resources','more.forceUpdate':'Force Update (clear cache & reload)','more.close':'Close',
      'ph.quotes':'Start your quote flow here.',
      'ph.history':'Recent quotes. (Later: quick-add from prior tickets.)',
      'ph.customers':'Customer list & quick search.',
      'ph.presets':'Your saved presets will appear here.',
      'ph.analytics':'KPIs & date-range reports.',
      'ph.settings':'Language, currency, role.',
      'ph.business':'Business name, logo, contact, financial defaults.',
      'ph.resources':'Employees, sublets, suppliers.',
      'settings.title':'App Preferences',
      'settings.lang':'Language',
      'settings.currency':'Currency',
      'settings.code':'Code',
      'settings.symbol':'Symbol',
      'settings.locale':'Locale',
      'settings.access':'Access (dev only)',
      'settings.plan':'Plan',
      'settings.role':'Role',
      'settings.save':'Save',
      'settings.data':'Data (dev only)',
      'settings.seed':'Seed demo data',
      'settings.wipe':'Wipe all data',
      'toast.saved':'Saved',
      'toast.savefail':'Save failed',
      'toast.cleared':'Cleared'
    },
    es: {
      'app.title':'Quote AutoMate',
      'tabs.quotes':'Cotizaciones','tabs.history':'Historial','tabs.customers':'Clientes',
      'tabs.presets':'Preajustes','tabs.analytics':'Análisis','tabs.more':'Más',
      'more.title':'Más','more.settings':'Ajustes','more.business':'Información del negocio',
      'more.resources':'Recursos','more.forceUpdate':'Forzar actualización (borrar caché y recargar)','more.close':'Cerrar',
      'ph.quotes':'Comienza tu flujo de cotización aquí.',
      'ph.history':'Cotizaciones recientes. (Después: añadir rápido desde tickets previos.)',
      'ph.customers':'Lista de clientes y búsqueda rápida.',
      'ph.presets':'Tus preajustes aparecerán aquí.',
      'ph.analytics':'KPIs e informes por rango de fechas.',
      'ph.settings':'Idioma, moneda, rol.',
      'ph.business':'Nombre del negocio, logo, contacto y valores por defecto.',
      'ph.resources':'Empleados, subcontratos, proveedores.',
      'settings.title':'Preferencias de la app',
      'settings.lang':'Idioma',
      'settings.currency':'Moneda',
      'settings.code':'Código',
      'settings.symbol':'Símbolo',
      'settings.locale':'Configuración regional',
      'settings.access':'Acceso (solo desarrollo)',
      'settings.plan':'Plan',
      'settings.role':'Rol',
      'settings.save':'Guardar',
      'settings.data':'Datos (solo desarrollo)',
      'settings.seed':'Sembrar datos demo',
      'settings.wipe':'Borrar todos los datos',
      'toast.saved':'Guardado',
      'toast.savefail':'Error al guardar',
      'toast.cleared':'Borrado'
    }
  };
  const t = (key) => (STRINGS[App.lang] && STRINGS[App.lang][key]) || STRINGS.en[key] || key;

  function applyI18n(){
    // static text
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    // aria labels (tab chips)
    const ariaMap = {
      'tab-quotes':'tabs.quotes','tab-history':'tabs.history','tab-customers':'tabs.customers',
      'tab-presets':'tabs.presets','tab-analytics':'tabs.analytics',
      'tab-settings':'more.settings','tab-business':'more.business','tab-resources':'more.resources'
    };
    Object.entries(ariaMap).forEach(([id,key])=>{
      const el = document.getElementById(id); if (el) el.setAttribute('aria-label', t(key));
    });
    // placeholders (content stubs)
    setPlaceholders();
    // adapt bottom labels to device width (after translation)
    adaptTabLabels();
  }

  /* ------------ Utilities ------------ */
  const $  = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));

  function setOnline(){
    const el=$('#net-status'); if(!el) return;
    const on=navigator.onLine;
    el.textContent = on ? 'Online' : 'Offline';
    el.classList.toggle('online', on);
    el.classList.toggle('offline', !on);
  }
  function setSWBadge(t){ const b=$('#sw-status'); if(b) b.textContent=`SW: ${t}`; }

  function toast(msg){
    const tdiv=document.createElement('div');
    tdiv.textContent=msg;
    tdiv.style.cssText='position:fixed;left:50%;bottom:calc(var(--tabbar-h) + 20px);transform:translateX(-50%);background:#182034;color:#e9eef8;padding:8px 12px;border-radius:10px;border:1px solid #232836;z-index:50';
    document.body.appendChild(tdiv);
    setTimeout(()=>tdiv.remove(),1400);
  }

  /* ------------ Placeholders ------------ */
  function setPlaceholders(){
    const map = {
      quotes:'ph.quotes', history:'ph.history', customers:'ph.customers',
      presets:'ph.presets', analytics:'ph.analytics',
      settings:'ph.settings', business:'ph.business', resources:'ph.resources'
    };
    Object.entries(map).forEach(([k,key])=>{
      const el=$('#tab-'+k);
      if (!el) return;
      let ph = el.querySelector('.placeholder');
      if (!ph){
        ph = document.createElement('div');
        ph.className='placeholder'; el.appendChild(ph);
      }
      ph.textContent = t(key);
    });
  }

  /* ------------ Tabs & More ------------ */
  function showTab(tab){
    $$('.tab-pane').forEach(p=>{p.classList.remove('active');p.hidden=true;});
    const pane = $('#tab-'+tab); if (pane){pane.hidden=false;pane.classList.add('active');}
    $$('.tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
    if (tab!=='more'){ try{localStorage.setItem('QAM_lastTab', tab);}catch(_){ } closeMore(); }
    if (tab==='settings') renderSettings();
  }
  function openMore(){ const d=$('#more-dialog'); if(d && !d.open) d.showModal(); }
  function closeMore(){ const d=$('#more-dialog'); if(d && d.open) d.close(); }

  function initTabs(){
    adaptTabLabels();
    window.addEventListener('resize', adaptTabLabels);

    $$('.tab-btn').forEach(b=>{
      b.addEventListener('click', ()=>{
        const ttab=b.dataset.tab;
        if (ttab==='more'){ openMore(); return; }
        showTab(ttab);
      }, {passive:true});
    });
    $('#more-close')?.addEventListener('click', closeMore);
    $$('#more-dialog .sheet-item').forEach(it=>{
      it.addEventListener('click', ()=>{ const ttab=it.dataset.tab; if (ttab) showTab(ttab); });
    });

    let last='quotes'; try{const s=localStorage.getItem('QAM_lastTab'); if(s) last=s;}catch(_){}
    showTab(last);
  }

  function adaptTabLabels(){
    const w = window.innerWidth || document.documentElement.clientWidth;
    const short = w < 360;
    const labels = [
      {tab:'quotes', full:t('tabs.quotes'),    short:t('tabs.quotes').length>6?'Quote':t('tabs.quotes')},
      {tab:'history', full:t('tabs.history'),  short:t('tabs.history').length>6?'Hist':t('tabs.history')},
      {tab:'customers', full:t('tabs.customers'), short:t('tabs.customers').length>8?'Cust':t('tabs.customers')},
      {tab:'presets', full:t('tabs.presets'),  short:t('tabs.presets')},
      {tab:'analytics', full:t('tabs.analytics'), short:t('tabs.analytics').length>8?'Stats':t('tabs.analytics')},
      {tab:'more', full:t('tabs.more'), short:t('tabs.more')}
    ];
    labels.forEach(({tab,full,short:sh})=>{
      const btn = $(`.tab-btn[data-tab="${tab}"]`);
      if (btn) btn.textContent = short ? sh : full;
    });
  }

  /* ------------ Settings ------------ */
  function renderSettings(){
    const el = $('#tab-settings'); if (!el) return;
    el.innerHTML = `
      <div class="card">
        <strong data-i18n="settings.title">App Preferences</strong>
        <label data-i18n="settings.lang">Language</label>
        <select id="lang">
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>

      <div class="card">
        <strong data-i18n="settings.currency">Currency</strong>
        <label data-i18n="settings.code">Code</label><input id="ccode" value="${App.currency.code}">
        <label data-i18n="settings.symbol">Symbol</label><input id="csym" value="${App.currency.symbol}">
        <label data-i18n="settings.locale">Locale</label><input id="cloc" value="${App.currency.locale}">
        <small class="hint">Examples: USD/$/en-US • EUR/€/de-DE • GBP/£/en-GB</small>
      </div>

      <div class="card">
        <strong data-i18n="settings.access">Access (dev only)</strong>
        <div data-i18n="settings.plan">Plan</div>
        <label><input type="radio" name="plan" value="lite" ${App.plan==='lite'?'checked':''}> Lite</label>
        <label><input type="radio" name="plan" value="pro"  ${App.plan==='pro'?'checked':''}> Pro</label>
        <div data-i18n="settings.role" style="margin-top:8px;">Role</div>
        <label><input type="radio" name="role" value="tech"   ${App.role==='tech'?'checked':''}> Technician</label>
        <label><input type="radio" name="role" value="sa"     ${App.role==='sa'?'checked':''}> Service Advisor</label>
        <label><input type="radio" name="role" value="owner"  ${App.role==='owner'?'checked':''}> Owner</label>
        <div style="margin-top:8px;">
          <button id="save-settings" data-i18n="settings.save">Save</button>
        </div>
      </div>

      <div class="card">
        <strong data-i18n="settings.data">Data (dev only)</strong>
        <button id="seed" data-i18n="settings.seed">Seed demo data</button>
        <button id="wipe" class="danger" data-i18n="settings.wipe">Wipe all data</button>
        <div id="counts" class="muted"></div>
      </div>
    `;
    $('#lang').value = App.lang;
    applyI18n(); // localize the settings UI itself

    $('#save-settings').onclick = ()=>{
      try{
        App.lang = $('#lang').value || 'en';
        App.currency = {
          code: $('#ccode').value.trim() || 'USD',
          symbol: $('#csym').value.trim() || '$',
          locale: $('#cloc').value.trim() || 'en-US'
        };
        App.plan = (document.querySelector('input[name="plan"]:checked')||{}).value || 'lite';
        App.role = (document.querySelector('input[name="role"]:checked')||{}).value || 'tech';
        App.save();
        applyI18n();     // <-- re-translate the whole app immediately
        toast(t('toast.saved'));
      }catch(e){
        toast(t('toast.savefail'));
      }
    };

    $('#seed').onclick = ()=>{ seedDemo(); updateCounts(); };
    $('#wipe').onclick = ()=>{ localStorage.clear(); App.save(); updateCounts(); toast(t('toast.cleared')); };
    updateCounts();
  }

  /* ------------ Demo seed counters ------------ */
  function updateCounts(){
    const k='QAM_COUNTS';
    const c = JSON.parse(localStorage.getItem(k)||'{"q":0,"c":0,"v":0,"p":0}');
    const el=$('#counts'); if (el) el.textContent = `Counts — Quotes: ${c.q}, Customers: ${c.c}, Vehicles: ${c.v}, Presets: ${c.p}`;
  }
  function seedDemo(){
    const k='QAM_COUNTS';
    const c = JSON.parse(localStorage.getItem(k)||'{"q":0,"c":0,"v":0,"p":0}');
    c.q+=2; c.c+=2; c.v+=2; c.p+=1;
    localStorage.setItem(k, JSON.stringify(c));
  }

  /* ------------ Force Update ------------ */
  async function forceUpdate(){
    try{
      if ('caches' in window){
        const keys=await caches.keys();
        await Promise.all(keys.map(k=>caches.delete(k)));
      }
      if (navigator.serviceWorker?.controller){
        navigator.serviceWorker.controller.postMessage({type:'SKIP_WAITING'});
      }
    }catch(_){}
    location.reload();
  }

  /* ------------ Boot ------------ */
  document.addEventListener('DOMContentLoaded', ()=>{
    App.load();
    setOnline();
    setPlaceholders();
    initTabs();
    App.save();
    document.getElementById('force-update')?.addEventListener('click', forceUpdate);
  });
  window.addEventListener('online', setOnline);
  window.addEventListener('offline', setOnline);

  /* ------------ Service Worker ------------ */
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