(() => {
  // ---------------- Core app state ----------------
  const App = {
    version: '0.3.2-skeleton-stable',
    plan: 'lite',      // dev toggle; will be server-activated later
    role: 'tech',      // 'tech'|'sa'|'owner'
    lang: 'en',
    currency: { code:'USD', symbol:'$', locale:'en-US' },
    load(){
      try{Object.assign(this, JSON.parse(localStorage.getItem('QAM_STATE')||'{}'));}catch(_){}
    },
    save(){
      try{localStorage.setItem('QAM_STATE', JSON.stringify({
        version:this.version, plan:this.plan, role:this.role, lang:this.lang, currency:this.currency
      }));}catch(_){}
    }
  };

  // ---------------- Utilities ----------------
  const $ = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

  const fmt = {
    money(v){ try{
      return new Intl.NumberFormat(App.currency.locale,{style:'currency',currency:App.currency.code}).format(v||0);
    }catch(_){ return `${App.currency.symbol}${(v||0).toFixed(2)}`; } },
  };

  // ---------------- Network + SW badges ----------------
  function setOnline() {
    const el = $('#net-status'); if (!el) return;
    const on = navigator.onLine;
    el.textContent = on ? 'Online' : 'Offline';
    el.classList.toggle('online', on);
    el.classList.toggle('offline', !on);
  }
  function setSWBadge(t){ const b = $('#sw-status'); if (b) b.textContent = `SW: ${t}`; }

  // ---------------- Tab system ----------------
  function showTab(tab){
    $$('.tab-pane').forEach(p=>{p.classList.remove('active');p.hidden=true;});
    const pane = $('#tab-'+tab); if (pane){pane.hidden=false;pane.classList.add('active');}
    $$('.tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
    if (tab!=='more') try{localStorage.setItem('QAM_lastTab', tab);}catch(_){}
    if (tab!=='more') closeMore();
    if (tab==='settings') renderSettings();     // ensure fresh wiring
  }

  function initTabs(){
    $$('.tab-btn').forEach(b=>{
      b.addEventListener('click', ()=>{
        const t = b.dataset.tab;
        if (t==='more'){ openMore(); return; }
        showTab(t);
      }, {passive:true});
    });

    $('#more-close')?.addEventListener('click', closeMore);
    $$('#more-dialog .sheet-item').forEach(it=>{
      it.addEventListener('click', (e)=>{ const t=it.dataset.tab; if (t) showTab(t); });
    });

    let last='quotes';
    try{const s=localStorage.getItem('QAM_lastTab'); if (s) last=s;}catch(_){}
    showTab(last);
  }

  function openMore(){ const d=$('#more-dialog'); if (d && !d.open) d.showModal(); }
  function closeMore(){ const d=$('#more-dialog'); if (d && d.open) d.close(); }

  // ---------------- Settings render (stable) ----------------
  function renderSettings(){
    const el = $('#tab-settings');
    if (!el) return;

    el.innerHTML = `
      <div class="placeholder" style="border-style:solid">
        <strong>Settings</strong>
      </div>
      <div class="card">
        <label>Language</label>
        <select id="lang">
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>

      <div class="card">
        <label>Currency</label>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          <input id="ccode" placeholder="Code" value="${App.currency.code}">
          <input id="csym"  placeholder="Symbol" value="${App.currency.symbol}">
          <input id="cloc"  placeholder="Locale" value="${App.currency.locale}">
        </div>
      </div>

      <div class="card">
        <label>Access (dev only)</label>
        <div>Plan:
          <label><input type="radio" name="plan" value="lite" ${App.plan==='lite'?'checked':''}> Lite</label>
          <label><input type="radio" name="plan" value="pro"  ${App.plan==='pro'?'checked':''}> Pro</label>
        </div>
        <div>Role:
          <label><input type="radio" name="role" value="tech"   ${App.role==='tech'?'checked':''}> Technician</label>
          <label><input type="radio" name="role" value="sa"     ${App.role==='sa'?'checked':''}> Service Advisor</label>
          <label><input type="radio" name="role" value="owner"  ${App.role==='owner'?'checked':''}> Owner</label>
        </div>
        <button id="save-settings">Save</button>
      </div>

      <div class="card">
        <label>Data (dev only)</label>
        <button id="seed">Seed demo data</button>
        <button id="wipe" class="danger">Wipe all data</button>
        <div id="counts" class="muted"></div>
      </div>
    `;

    // set select
    $('#lang').value = App.lang;

    // wire events
    $('#save-settings').onclick = ()=>{
      try{
        App.lang = $('#lang').value;
        App.currency = { code:$('#ccode').value.trim()||'USD',
                         symbol:$('#csym').value.trim()||'$',
                         locale:$('#cloc').value.trim()||'en-US' };
        App.plan = $('input[name="plan"]:checked').value;
        App.role = $('input[name="role"]:checked').value;
        App.save();
        toast('Saved');
      }catch(e){ toast('Save failed'); }
    };
    $('#seed').onclick = ()=>{ seedDemo(); updateCounts(); };
    $('#wipe').onclick = ()=>{ localStorage.clear(); App.save(); updateCounts(); toast('Cleared'); };
    updateCounts();
  }

  function toast(msg){
    // simple non-blocking toast
    const t=document.createElement('div');
    t.textContent=msg;
    t.style.cssText='position:fixed;left:50%;bottom:84px;transform:translateX(-50%);background:#182034;color:#e9eef8;padding:8px 12px;border-radius:10px;border:1px solid #232836;z-index:50';
    document.body.appendChild(t); setTimeout(()=>t.remove(),1400);
  }

  function updateCounts(){
    const counts = JSON.parse(localStorage.getItem('QAM_COUNTS')||'{"q":0,"c":0,"v":0,"p":0}');
    const el = $('#counts'); if (el) el.textContent = `Counts — Quotes: ${counts.q}, Customers: ${counts.c}, Vehicles: ${counts.v}, Presets: ${counts.p}`;
  }
  function seedDemo(){
    const k='QAM_COUNTS';
    const c = JSON.parse(localStorage.getItem(k) || '{"q":0,"c":0,"v":0,"p":0}');
    c.q+=2; c.c+=2; c.v+=2; c.p+=1;
    localStorage.setItem(k, JSON.stringify(c));
  }

  // ---------------- Install prompt (manual button shows only when allowed) ----------------
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault(); deferredPrompt = e;
    $('#install-btn').hidden = false;
  });
  $('#install-btn')?.addEventListener('click', async ()=>{
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    $('#install-btn').hidden = true;
  });

  // ---------------- Force update ----------------
  async function forceUpdate(){
    try{
      if ('caches' in window){ const keys = await caches.keys(); await Promise.all(keys.map(k=>caches.delete(k))); }
      if (navigator.serviceWorker?.controller){ navigator.serviceWorker.controller.postMessage({type:'SKIP_WAITING'}); }
    }catch(_){}
    location.reload();
  }
  $('#force-update')?.addEventListener('click', forceUpdate);

  // ---------------- Boot ----------------
  document.addEventListener('DOMContentLoaded', ()=>{
    App.load(); setOnline(); initTabs(); renderPlaceholders(); renderSettings(); App.save();
  });
  window.addEventListener('online', setOnline); window.addEventListener('offline', setOnline);

  function renderPlaceholders(){
    const map = {
      quotes:'Start your quote flow here.',
      history:'Recent quotes. (Later: quick-add from prior tickets.)',
      customers:'Customer list & quick search.',
      presets:'Your saved presets will appear here.',
      analytics:'KPIs & date-range reports.',
      settings:'Language, currency, role.',
      business:'Business name, logo, contact, financial defaults.',
      resources:'Employees, sublets, suppliers.'
    };
    Object.entries(map).forEach(([k,v])=>{
      const el = $('#tab-'+k);
      if (el && !el.dataset.mounted){
        const b = document.createElement('div'); b.className='placeholder'; b.textContent=v;
        el.appendChild(b); el.dataset.mounted='1';
      }
    });
  }

  // ---------------- Service worker ----------------
  if ('serviceWorker' in navigator){
    window.addEventListener('load', async ()=>{
      try{
        const reg = await navigator.serviceWorker.register('./service-worker.js');
        setSWBadge(reg.active ? 'registered' : 'installing');
        navigator.serviceWorker.addEventListener('controllerchange', ()=> setSWBadge('updated'));
      }catch(e){ setSWBadge('error'); }
    });
  } else { setSWBadge('n/a'); }
})();