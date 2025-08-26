(() => {
  // ============= Event Bus =============
  const Bus = (() => {
    const topics = new Map();
    return {
      on(topic, fn){ if(!topics.has(topic)) topics.set(topic,new Set()); topics.get(topic).add(fn); return ()=>topics.get(topic)?.delete(fn); },
      off(topic, fn){ topics.get(topic)?.delete(fn); },
      emit(topic, payload){ topics.get(topic)?.forEach(fn=>{ try{ fn(payload); }catch(e){ console.error(e); } }); }
    };
  })();

  // ============= App State =============
  const App = {
    version: '1.0.0-skeleton+bus',
    plan: 'lite',
    role: 'tech',
    lang: 'en',
    currency: { code:'USD', symbol:'$', locale:'en-US' },
    load(){ try{ const raw=localStorage.getItem('QAM_STATE'); if(raw) Object.assign(this, JSON.parse(raw)); }catch{} },
    save(){ try{
      localStorage.setItem('QAM_STATE', JSON.stringify({
        version:this.version, plan:this.plan, role:this.role, lang:this.lang, currency:this.currency
      }));
      Bus.emit('app:saved', { plan:this.plan, role:this.role, lang:this.lang, currency:this.currency });
    }catch{} }
  };
  window.QAM = { App, bus:Bus };

  // ============= i18n =============
  const STRINGS = {
    en:{
      'app.title':'Quote AutoMate',
      'tabs.quotes':'Quotes','tabs.history':'History','tabs.customers':'Customers','tabs.presets':'Presets','tabs.analytics':'Analytics','tabs.more':'More',
      'more.title':'More','more.settings':'Settings','more.business':'Business Info','more.resources':'Resources','more.forceUpdate':'Force Update (clear cache & reload)','more.close':'Close',
      'ph.quotes':'Start your quote flow here.','ph.history':'Recent quotes. (Later: quick-add from prior tickets.)','ph.customers':'Customer list & quick search.','ph.presets':'Your saved presets will appear here.','ph.analytics':'KPIs & date-range reports.',
      'ph.settings':'Language, currency, role.','ph.business':'Business name, logo, contact, financial defaults.','ph.resources':'Employees, sublets, suppliers.',
      'toast.saved':'Saved','toast.cleared':'Cleared','toast.error':'Something went wrong',
      'settings.plan':'Plan','settings.role':'Role','settings.lang':'Language','settings.hint':'These are dev toggles for now; purchases will unlock features later.',
      'settings.seed':'Seed demo +2','settings.clear':'Clear data','settings.save':'Save'
    },
    es:{
      'app.title':'Quote AutoMate',
      'tabs.quotes':'Cotizaciones','tabs.history':'Historial','tabs.customers':'Clientes','tabs.presets':'Preajustes','tabs.analytics':'Análisis','tabs.more':'Más',
      'more.title':'Más','more.settings':'Ajustes','more.business':'Información del negocio','more.resources':'Recursos','more.forceUpdate':'Forzar actualización (borrar caché y recargar)','more.close':'Cerrar',
      'ph.quotes':'Comienza tu flujo de cotización aquí.','ph.history':'Cotizaciones recientes. (Después: añadir rápido desde tickets previos.)','ph.customers':'Lista de clientes y búsqueda rápida.','ph.presets':'Tus preajustes aparecerán aquí.','ph.analytics':'KPIs e informes por rango de fechas.',
      'ph.settings':'Idioma, moneda, rol.','ph.business':'Nombre del negocio, logo, contacto y valores por defecto.','ph.resources':'Empleados, subcontratos, proveedores.',
      'toast.saved':'Guardado','toast.cleared':'Borrado','toast.error':'Ocurrió un error',
      'settings.plan':'Plan','settings.role':'Rol','settings.lang':'Idioma','settings.hint':'Por ahora son conmutadores de desarrollo; las compras desbloquearán funciones.',
      'settings.seed':'Semilla demo +2','settings.clear':'Borrar datos','settings.save':'Guardar'
    }
  };
  const t = (k)=> (STRINGS[App.lang] && STRINGS[App.lang][k]) || STRINGS.en[k] || k;
  window.QAM.t = t;

  function applyI18n(){
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const k = el.getAttribute('data-i18n'); el.textContent = t(k);
    });
    const ariaMap = {
      'tab-quotes':'tabs.quotes','tab-history':'tabs.history','tab-customers':'tabs.customers',
      'tab-presets':'tabs.presets','tab-analytics':'tabs.analytics',
      'tab-settings':'more.settings','tab-business':'more.business','tab-resources':'more.resources'
    };
    Object.entries(ariaMap).forEach(([id,key])=>{
      const el = document.getElementById(id); if (el) el.setAttribute('aria-label', t(key));
    });
    const ph = { quotes:'ph.quotes',history:'ph.history',customers:'ph.customers',presets:'ph.presets',analytics:'ph.analytics',settings:'ph.settings',business:'ph.business',resources:'ph.resources' };
    Object.entries(ph).forEach(([pane,key])=>{
      const el = document.querySelector('#tab-'+pane); if (!el) return;
      let p = el.querySelector('.placeholder');
      if (!p){ p = document.createElement('div'); p.className='placeholder'; el.appendChild(p); }
      p.textContent = t(key);
    });
  }

  // ============= Toasts / Confirm =============
  function ensureToastsRoot(){
    if (document.getElementById('toasts-root')) return;
    const style = document.createElement('style');
    style.textContent = `
      .toasts{position:fixed;bottom:78px;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:8px;z-index:50}
      .toast{background:#101521;color:#e9eef8;border:1px solid #232836;border-radius:10px;padding:10px 12px;min-width:200px;text-align:center;opacity:.98}
      .toast.ok{border-color:#1f5f2f} .toast.err{border-color:#5f1f1f}
      dialog.qam-confirm{border:none;padding:0;background:transparent}
      dialog.qam-confirm::backdrop{background:rgba(0,0,0,.35)}
      .confirm-sheet{position:fixed;left:0;right:0;bottom:0;background:#151924;border:1px solid #232836;border-top-left-radius:18px;border-top-right-radius:18px;padding:12px}
      .confirm-actions{display:flex;gap:8px;margin-top:8px}
      .btn{flex:1;background:#101521;color:#e9eef8;border:1px solid #232836;border-radius:10px;padding:10px}
      .btn.primary{background:#182034}
    `;
    document.head.appendChild(style);
    const root = document.createElement('div'); root.id='toasts-root'; root.className='toasts'; document.body.appendChild(root);
    const dlg = document.createElement('dialog'); dlg.className='qam-confirm';
    dlg.innerHTML = `
      <div class="confirm-sheet">
        <div id="confirm-text" style="margin-bottom:8px"></div>
        <div class="confirm-actions">
          <button id="confirm-cancel" class="btn">Cancel</button>
          <button id="confirm-ok" class="btn primary">OK</button>
        </div>
      </div>`;
    document.body.appendChild(dlg);
  }
  function toast(msg,type='ok',ms=1400){
    ensureToastsRoot();
    const root=document.getElementById('toasts-root');
    const el=document.createElement('div'); el.className=`toast ${type==='error'?'err':'ok'}`; el.textContent=msg;
    root.appendChild(el); setTimeout(()=>{ el.style.opacity='0'; setTimeout(()=>el.remove(),250); }, ms);
  }
  async function confirmSheet(message){
    ensureToastsRoot();
    const dlg=document.querySelector('dialog.qam-confirm');
    dlg.querySelector('#confirm-text').textContent=message;
    return new Promise(resolve=>{
      const ok=dlg.querySelector('#confirm-ok'); const cancel=dlg.querySelector('#confirm-cancel');
      const done=()=>{ ok.onclick=cancel.onclick=null; dlg.close(); };
      ok.onclick=()=>{ done(); resolve(true); };
      cancel.onclick=()=>{ done(); resolve(false); };
      dlg.showModal();
    });
  }
  window.QAM.toast = toast; window.QAM.confirm = confirmSheet;

  // ============= Net & SW badge =============
  function setOnlineStatus(){
    const el=document.getElementById('net-status'); if(!el) return;
    const online=navigator.onLine;
    el.textContent = online ? 'Online' : 'Offline';
    el.classList.toggle('online', online);
    el.classList.toggle('offline', !online);
    Bus.emit('net:status', { online });
  }
  function initNet(){ setOnlineStatus(); addEventListener('online',setOnlineStatus); addEventListener('offline',setOnlineStatus); }
  function setSWBadge(text){ const el=document.getElementById('sw-status'); if(el) el.textContent=`SW: ${text}`; }

  // ============= Tabs + More =============
  const $ = (s,r=document)=>r.querySelector(s);
  const $all = (s,r=document)=>Array.from(r.querySelectorAll(s));
  function showTab(tab){
    $all('.tab-pane').forEach(p=>{ p.classList.remove('active'); p.hidden=true; });
    const pane=$('#tab-'+tab); if(pane){ pane.hidden=false; pane.classList.add('active'); }
    $all('.tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
    try{ localStorage.setItem('QAM_lastTab', tab); }catch{}
    closeMore(); Bus.emit('ui:tabChanged',{tab});
  }
  function openMore(){ const d=$('#more-dialog'); if(d && !d.open) d.showModal(); }
  function closeMore(){ const d=$('#more-dialog'); if(d && d.open) d.close(); }
  function initTabs(){
    $all('.tab-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{ const t = btn.dataset.tab; if (t==='more') {openMore(); return;} showTab(t); }, {passive:true});
    });
    $('#more-close')?.addEventListener('click', closeMore);
    $all('.more-item').forEach(item=>{
      item.addEventListener('click', (e)=>{ e.preventDefault(); const t=item.dataset.tab; if(t) showTab(t); });
    });
    let last='quotes'; try{ const s=localStorage.getItem('QAM_lastTab'); if(s) last=s; }catch{}
    showTab(last);
  }

  // ============= Force Update =============
  async function forceUpdate(){
    try{
      if('caches' in window){ const keys=await caches.keys(); await Promise.all(keys.map(k=>caches.delete(k))); }
      if(navigator.serviceWorker?.controller){ navigator.serviceWorker.controller.postMessage({type:'SKIP_WAITING'}); }
    }catch{}
    Bus.emit('app:forceUpdate'); location.reload();
  }
  function initForceUpdate(){
    document.getElementById('force-update')?.addEventListener('click', forceUpdate);
    document.addEventListener('keydown',(e)=>{ if((e.ctrlKey||e.metaKey)&&e.altKey&&e.key.toLowerCase()==='u') forceUpdate(); });
  }

  // ============= Settings hooks =============
  function initSettingsHooks(){
    const planSel = document.getElementById('plan-select');
    const roleSel = document.getElementById('role-select');
    const langSel = document.getElementById('lang-select');
    const seedBtn = document.getElementById('seed-demo');
    const clearBtn = document.getElementById('clear-data');
    const saveBtn  = document.getElementById('save-settings');

    if (planSel){ planSel.value=App.plan; planSel.onchange=()=>{ App.plan=planSel.value; Bus.emit('plan:changed',{plan:App.plan}); }; }
    if (roleSel){ roleSel.value=App.role; roleSel.onchange=()=>{ App.role=roleSel.value; Bus.emit('role:changed',{role:App.role}); }; }
    if (langSel){ langSel.value=App.lang; langSel.onchange=()=>{ App.lang=langSel.value; applyI18n(); Bus.emit('lang:changed',{lang:App.lang}); }; }

    if (seedBtn){
      seedBtn.addEventListener('click', ()=>{
        const key='QAM_SEED_COUNT'; let n=0; try{ n=parseInt(localStorage.getItem(key)||'0',10)||0; }catch{}
        n+=2; try{ localStorage.setItem(key,String(n)); }catch{}
        toast(`Seed = ${n}`); Bus.emit('seed:incremented',{value:n});
      });
    }
    if (clearBtn){
      clearBtn.addEventListener('click', async ()=>{
        const ok = await confirmSheet('Clear local data?'); if(!ok) return;
        try{ localStorage.clear(); toast(t('toast.cleared')); Bus.emit('storage:cleared'); }catch{ toast(t('toast.error'),'error'); }
        setTimeout(()=>location.reload(), 300);
      });
    }
    if (saveBtn){
      saveBtn.addEventListener('click', ()=>{ App.save(); applyI18n(); toast(t('toast.saved')); Bus.emit('settings:changed',{plan:App.plan,role:App.role,lang:App.lang,currency:App.currency}); });
    }
  }

  // ============= Boot =============
  document.addEventListener('DOMContentLoaded', ()=>{
    App.load(); applyI18n(); initNet(); initTabs(); initForceUpdate(); initSettingsHooks(); App.save();
  });

  // ============= Service Worker =============
  if ('serviceWorker' in navigator){
    window.addEventListener('load', async ()=>{
      try{
        const reg = await navigator.serviceWorker.register('./service-worker.js');
        const badge = reg.active ? 'registered' : 'installing';
        const el = document.getElementById('sw-status'); if (el) el.textContent = `SW: ${badge}`;
        navigator.serviceWorker.addEventListener('controllerchange', ()=>{ const el2=document.getElementById('sw-status'); if (el2) el2.textContent='SW: updated'; });
      }catch(e){
        const el=document.getElementById('sw-status'); if (el) el.textContent='SW: error';
      }
    });
  } else {
    const el=document.getElementById('sw-status'); if (el) el.textContent='SW: n/a';
  }

  // sample subscribers (safe no-ops)
  Bus.on('settings:changed', ({plan,role,lang})=>{ console.log('[bus] settings changed', plan, role, lang); });
})();