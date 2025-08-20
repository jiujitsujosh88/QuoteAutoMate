// app.js
(function(){
  const State = { activeTab: 'quotes' };
  const $ = (sel, root=document) => root.querySelector(sel);
  const $all = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // ---- Service Worker badge ----
  function setSwBadge(){
    const el = $('#sw-badge'); if(!el) return;
    const ok = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
    el.textContent = ok ? 'SW: registered' : 'SW: not registered';
    el.classList.toggle('ok', ok);
    el.classList.toggle('miss', !ok);
  }

  // ---- Network badge ----
  function setOnlineStatus(){
    const el = $('#net-status'); if(!el) return;
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

  // ---- Tabs ----
  function showTab(tab){
    $all('.tab-pane').forEach(p => { p.classList.remove('active'); p.hidden = true; });
    const pane = $('#tab-' + tab);
    if (pane){ pane.hidden = false; pane.classList.add('active'); }
    $all('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
    closeMore();
    State.activeTab = tab;
    try { localStorage.setItem('lastTab', tab); } catch(_) {}
  }

  function initTabs(){
    // bottom buttons
    $all('.tab-btn').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        const t = btn.dataset.tab;
        if (t === 'more'){ openMore(); return; }
        showTab(t);
      }, {passive:true});
    });

    // restore last
    let last = 'quotes';
    try { const saved = localStorage.getItem('lastTab'); if (saved) last = saved; } catch(_) {}
    showTab(last);
  }

  // ---- More dialog (native <dialog>) ----
  function openMore(){
    const dlg = $('#moreDialog');
    if (!dlg) return;
    if (typeof dlg.showModal === 'function') dlg.showModal();
    // wire inside buttons each time (safe idempotent)
    $all('.more-item', dlg).forEach(item=>{
      item.onclick = (e)=>{ e.preventDefault(); e.stopPropagation(); showTab(item.dataset.tab); };
    });
    $all('[data-close]', dlg).forEach(x=>{
      x.onclick = ()=> { try{ dlg.close(); }catch(_){} };
    });
  }
  function closeMore(){
    const dlg = $('#moreDialog');
    if (dlg && dlg.open) { try{ dlg.close(); }catch(_){} }
  }

  // ---- Force update (clear caches + reload) ----
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
    $('#force-update')?.addEventListener('click', forceUpdate);
  }

  // ---- SW registration (don’t change your existing file names) ----
  function registerSW(){
    if ('serviceWorker' in navigator){
      navigator.serviceWorker.register('service-worker.js')
        .then(()=>setSwBadge())
        .catch(()=>setSwBadge());
      navigator.serviceWorker.addEventListener('controllerchange', setSwBadge);
    } else {
      setSwBadge();
    }
  }

  // ---- Boot ----
  document.addEventListener('DOMContentLoaded', ()=>{
    initNet();
    initTabs();
    initForceUpdate();
    registerSW();
    setSwBadge(); // initial
  });
})();