(() => {
  const App = {
    version: '0.3.1-tabs-tidy',
    plan: 'lite',        // dev toggle only
    role: 'tech',
    lang: 'en',
    currency: { code:'USD', symbol:'$', locale:'en-US' },
    load(){ try{Object.assign(this, JSON.parse(localStorage.getItem('QAM_STATE')||'{}'));}catch(_){ } },
    save(){ try{localStorage.setItem('QAM_STATE', JSON.stringify({
      version:this.version, plan:this.plan, role:this.role, lang:this.lang, currency:this.currency
    }));}catch(_){ } }
  };

  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));

  /* Online badge */
  function setOnline(){
    const el=$('#net-status'); if(!el) return;
    const on=navigator.onLine; el.textContent=on?'Online':'Offline';
    el.classList.toggle('online',on); el.classList.toggle('offline',!on);
  }
  function setSWBadge(t){ const b=$('#sw-status'); if(b) b.textContent=`SW: ${t}`; }

  /* Tab logic */
  function showTab(tab){
    $$('.tab-pane').forEach(p=>{p.classList.remove('active');p.hidden=true;});
    const pane = $('#tab-'+tab); if(pane){pane.hidden=false;pane.classList.add('active');}
    $$('.tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
    if (tab!=='more') { try{localStorage.setItem('QAM_lastTab', tab);}catch(_){ } closeMore(); }
    if (tab==='settings') renderSettings();
  }

  function initTabs(){
    // Adaptive labels on very small screens
    adaptTabLabels();
    window.addEventListener('resize', adaptTabLabels);

    $$('.tab-btn').forEach(b=>{
      b.addEventListener('click', ()=>{
        const t=b.dataset.tab;
        if (t==='more'){ openMore(); return; }
        showTab(t);
      }, {passive:true});
    });
    $('#more-close')?.addEventListener('click', closeMore);
    $$('#more-dialog .sheet-item').forEach(it=>{
      it.addEventListener('click', ()=>{ const t=it.dataset.tab; if (t) showTab(t); });
    });

    let last='quotes'; try{const s=localStorage.getItem('QAM_lastTab'); if(s) last=s;}catch(_){}
    showTab(last);
  }

  function adaptTabLabels(){
    const w = window.innerWidth || document.documentElement.clientWidth;
    const short = w < 360;
    const map = [
      {tab:'quotes', full:'Quotes', short:'Quote'},
      {tab:'history', full:'History', short:'Hist'},
      {tab:'customers', full:'Customers', short:'Cust'},
      {tab:'presets', full:'Presets', short:'Preset'},
      {tab:'analytics', full:'Analytics', short:'Stats'},
      {tab:'more', full:'More', short:'More'}
    ];
    map.forEach(({tab,full,short:sh})=>{
      const btn = $(`.tab-btn[data-tab="${tab}"]`);
      if (btn) btn.textContent = short ? sh : full;
    });
  }

  function openMore(){ const d=$('#more-dialog'); if(d && !d.open) d.showModal(); }
  function closeMore(){ const d=$('#more-dialog'); if(d && d.open) d.close(); }

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
      const el=$('#tab-'+k);
      if (el && !el.dataset.mounted){
        const b=document.createElement('div'); b.className='placeholder'; b.textContent=v;
        el.appendChild(b); el.dataset.mounted='1';
      }
    });
  }

  /* Settings */
  function renderSettings(){
    const el = $('#tab-settings'); if (!el) return;
    el.innerHTML = `
      <div class="card">
        <strong>App Preferences</strong>
        <label>Language</label>
        <select id="lang">
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </div>

      <div class="card">
        <strong>Currency</strong>
        <label>Code</label><input id="ccode" value="${App.currency.code}">
        <label>Symbol</label><input id="csym" value="${App.currency.symbol}">
        <label>Locale</label><input id="cloc" value="${App.currency.locale}">
        <small class="hint">Examples: USD/$/en-US • EUR/€/de-DE • GBP/£/en-GB</small>
      </div>

      <div class="card">
        <strong>Access (dev only)</strong>
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
        <strong>Data (dev only)</strong>
        <button id="seed">Seed demo data</button>
        <button id="wipe" class="danger">Wipe all data</button>
        <div id="counts" class="muted"></div>
      </div>
    `;
    $('#lang').value = App.lang;

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

  /* Toast */
  function toast(msg){
    const t=document.createElement('div');
    t.textContent=msg;
    t.style.cssText='position:fixed;left:50%;bottom:calc(var(--tabbar-h) + 20px);transform:translateX(-50%);background:#182034;color:#e9eef8;padding:8px 12px;border-radius:10px;border:1px solid #232836;z-index:50';
    document.body.appendChild(t); setTimeout(()=>t.remove(),1400);
  }

  /* Demo counters */
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

  /* Force Update */
  async function forceUpdate(){
    try{
      if ('caches' in window){ const keys=await caches.keys(); await Promise.all(keys.map(k=>caches.delete(k))); }
      if (navigator.serviceWorker?.controller){ navigator.serviceWorker.controller.postMessage({type:'SKIP_WAITING'}); }
    }catch(_){} location.reload();
  }

  /* Boot */
  document.addEventListener('DOMContentLoaded', ()=>{
    App.load(); setOnline(); renderPlaceholders(); initTabs(); App.save();
    $('#force-update')?.addEventListener('click', forceUpdate);
  });
  window.addEventListener('online', setOnline); window.addEventListener('offline', setOnline);

  /* SW */
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