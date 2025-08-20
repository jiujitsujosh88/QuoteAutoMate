/* Quote AutoMate – Skeleton core with roles/plan/i18n/currency scaffolding */

(function(){
  // ---------- App state ----------
  const App = {
    plan: 'lite',        // 'lite' | 'pro'
    role: 'tech',        // 'tech' | 'sa' | 'owner'
    locale: 'en-US',
    currency: 'USD',

    save(){
      try {
        localStorage.setItem('qam.settings', JSON.stringify({
          plan:this.plan, role:this.role, locale:this.locale, currency:this.currency
        }));
      } catch(_){}
    },
    load(){
      try {
        const s = JSON.parse(localStorage.getItem('qam.settings')||'{}');
        if (s.plan) this.plan = s.plan;
        if (s.role) this.role = s.role;
        if (s.locale) this.locale = s.locale;
        if (s.currency) this.currency = s.currency;
      } catch(_){}
    }
  };

  // ---------- Entitlements ----------
  const ENTITLEMENTS = {
    basicAnalytics:     { lite:true,  pro:true },
    analyticsAdvanced:  { pro:true },
    presetsParsing:     { pro:true },
    customerManager:    { pro:true, roles:['sa','owner'] },
    ownerOverhead:      { pro:true, roles:['owner'] },
    exports:            { pro:true }
  };
  function can(key){
    const rule = ENTITLEMENTS[key];
    if (!rule) return true;
    if (App.plan === 'pro' && rule.pro) {
      if (rule.roles) return rule.roles.includes(App.role);
      return true;
    }
    if (App.plan === 'lite' && rule.lite) {
      if (rule.roles) return rule.roles.includes(App.role);
      return true;
    }
    return false;
  }

  // ---------- i18n & formatting ----------
  const STR = {
    en: { quotes:'Quotes', history:'History', customers:'Customers', presets:'Presets', analytics:'Analytics', more:'More',
          settings:'Settings', business:'Business Info', resources:'Resources', install:'Install App' },
    es: { quotes:'Cotizaciones', history:'Historial', customers:'Clientes', presets:'Preajustes', analytics:'Analítica', more:'Más',
          settings:'Ajustes', business:'Info Comercial', resources:'Recursos', install:'Instalar App' },
    fr: { quotes:'Devis', history:'Historique', customers:'Clients', presets:'Préréglages', analytics:'Analytique', more:'Plus',
          settings:'Paramètres', business:'Infos Entreprise', resources:'Ressources', install:'Installer' },
    de: { quotes:'Angebote', history:'Verlauf', customers:'Kunden', presets:'Vorlagen', analytics:'Analytik', more:'Mehr',
          settings:'Einstellungen', business:'Firmendaten', resources:'Ressourcen', install:'App installieren' },
    ja: { quotes:'見積もり', history:'履歴', customers:'顧客', presets:'プリセット', analytics:'分析', more:'その他',
          settings:'設定', business:'事業情報', resources:'リソース', install:'アプリをインストール' },
  };
  const t = (key) => {
    const base = (App.locale || 'en').split('-')[0];
    return (STR[base] && STR[base][key]) || STR.en[key] || key;
  };
  const fmtMoney = (n) => new Intl.NumberFormat(App.locale, { style:'currency', currency: App.currency }).format(n);
  const fmtDate  = (d) => new Intl.DateTimeFormat(App.locale, { dateStyle:'medium' }).format(d);

  // ---------- DOM helpers ----------
  const $ = (sel, root=document) => root.querySelector(sel);
  const $all = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // Network badge
  function setOnlineStatus(){
    const el = $('#net-status'); if(!el) return;
    const online = navigator.onLine;
    el.textContent = online ? 'Online' : 'Offline';
    el.classList.toggle('online', online);
    el.classList.toggle('offline', !online);
  }

  // Labels per locale
  function renderTabLabels(){
    $('#btn-tab-quotes')   && ($('#btn-tab-quotes').textContent   = t('quotes'));
    $('#btn-tab-history')  && ($('#btn-tab-history').textContent  = t('history'));
    $('#btn-tab-customers')&& ($('#btn-tab-customers').textContent= t('customers'));
    $('#btn-tab-presets')  && ($('#btn-tab-presets').textContent  = t('presets'));
    $('#btn-tab-analytics')&& ($('#btn-tab-analytics').textContent= t('analytics'));
    $('#btn-tab-more')     && ($('#btn-tab-more').textContent     = t('more'));
    $('#more-title')       && ($('#more-title').textContent       = t('more'));
    $('#btn-more-settings')&& ($('#btn-more-settings').textContent = t('settings'));
    $('#btn-more-business')&& ($('#btn-more-business').textContent = t('business'));
    $('#btn-more-resources')&&($('#btn-more-resources').textContent= t('resources'));
  }

  // Tab show/hide
  function showTab(tab){
    $all('.tab-pane').forEach(p => { p.classList.remove('active'); p.hidden = true; });
    const pane = $('#tab-' + tab);
    if (pane){ pane.hidden = false; pane.classList.add('active'); }
    $all('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
    closeMore();
    try { localStorage.setItem('lastTab', tab); } catch(_){}
  }

  // More dialog
  function openMore(){
    const dlg = $('#more-dialog'), bd = $('#more-backdrop');
    if (!dlg) return;
    dlg.showModal();
    bd && (bd.hidden = false);
  }
  function closeMore(){
    const dlg = $('#more-dialog'), bd = $('#more-backdrop');
    if (!dlg) return;
    if (dlg.open) dlg.close();
    bd && (bd.hidden = true);
  }

  // Placeholder content
  function mountPlaceholders(){
    const fillers = {
      quotes:'Start your quote flow here.',
      history:'Recent quotes. (Later: quick-add from prior tickets.)',
      customers:'Customer list & quick search.',
      presets:'Your saved presets will appear here.',
      analytics:'KPIs & date-range reports.',
      settings:'Language, currency, role, plan.',
      business:'Business name, logo, contact, financial defaults.',
      resources:'Employees, sublets, suppliers.'
    };
    Object.entries(fillers).forEach(([k,txt])=>{
      const el = $('#tab-'+k);
      if (el && !el.dataset.mounted){
        const block = document.createElement('div');
        block.className = 'placeholder'; block.textContent = txt;
        el.appendChild(block); el.dataset.mounted='1';
      }
    });
  }

  // Bottom bar & sheet wiring
  function initTabbar(){
    $all('.tab-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const tname = btn.dataset.tab;
        if (tname === 'more') { openMore(); return; }
        showTab(tname);
      }, {passive:true});
    });
    $('#more-backdrop')?.addEventListener('click', closeMore);
    $('#more-close')?.addEventListener('click', closeMore);
    $('#btn-more-settings')?.addEventListener('click', ()=> showTab('settings'));
    $('#btn-more-business')?.addEventListener('click', ()=> showTab('business'));
    $('#btn-more-resources')?.addEventListener('click', ()=> showTab('resources'));

    let last = 'quotes';
    try { const saved = localStorage.getItem('lastTab'); if (saved) last = saved; } catch(_){}
    showTab(last);
  }

  // Settings form
  function renderSettings(){
    const selPlan = $('#sel-plan'), selRole = $('#sel-role');
    const selLoc  = $('#sel-locale'), selCur  = $('#sel-currency');
    if (selPlan) selPlan.value = App.plan;
    if (selRole) selRole.value = App.role;
    if (selLoc)  selLoc.value  = App.locale;
    if (selCur)  selCur.value  = App.currency;

    selPlan?.addEventListener('change', ()=>{ App.plan = selPlan.value; App.save(); });
    selRole?.addEventListener('change', ()=>{ App.role = selRole.value; App.save(); });
    selLoc?.addEventListener('change',  ()=>{ App.locale = selLoc.value; App.save(); renderTabLabels(); });
    selCur?.addEventListener('change',  ()=>{ App.currency = selCur.value; App.save(); });

    // Export/import settings
    $('#btn-export-settings')?.addEventListener('click', ()=>{
      const blob = new Blob([JSON.stringify({
        plan:App.plan, role:App.role, locale:App.locale, currency:App.currency
      }, null, 2)], {type:'application/json'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'qam-settings.json';
      a.click();
      setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
    });
    $('#btn-import-settings')?.addEventListener('click', ()=> $('#import-settings-file')?.click());
    $('#import-settings-file')?.addEventListener('change', (e)=>{
      const f = e.target.files?.[0]; if (!f) return;
      const r = new FileReader();
      r.onload = ()=> {
        try{
          const data = JSON.parse(r.result);
          if (data.plan) App.plan = data.plan;
          if (data.role) App.role = data.role;
          if (data.locale) App.locale = data.locale;
          if (data.currency) App.currency = data.currency;
          App.save();
          renderSettings();
          renderTabLabels();
          alert('Settings imported.');
        }catch(err){ alert('Invalid settings file.'); }
      };
      r.readAsText(f);
      e.target.value = '';
    });
  }

  // Force update (clear caches + reload)
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
  function initGlobalButtons(){
    $('#force-update-top')?.addEventListener('click', forceUpdate);
    $('#force-update')?.addEventListener('click', forceUpdate);
  }

  // SW badge + register
  function initSW(){
    const badge = $('#sw-badge');
    if (!('serviceWorker' in navigator)) { badge && (badge.textContent = 'SW: unsupported'); return; }
    navigator.serviceWorker.register('./service-worker.js').then(reg=>{
      badge && (badge.textContent = 'SW: registered');
      if (reg.waiting) reg.waiting.postMessage({type:'SKIP_WAITING'});
    }).catch(()=>{
      badge && (badge.textContent = 'SW: failed');
    });
  }

  // Boot
  document.addEventListener('DOMContentLoaded', ()=>{
    App.load();
    setOnlineStatus();
    addEventListener('online', setOnlineStatus);
    addEventListener('offline', setOnlineStatus);

    renderTabLabels();
    mountPlaceholders();
    initTabbar();
    renderSettings();
    initGlobalButtons();
    initSW();
  });

  // Expose minimal API for future modules
  window.QAM = { App, can, t, fmtMoney, fmtDate };
})();