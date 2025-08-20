// ------------------------------
// Quote AutoMate - Skeleton app.js
// ------------------------------

const State = {
  activeTab: 'quotes'
};

// ---- Helpers ----
function $(sel, root = document) { return root.querySelector(sel); }
function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

// ---- Network status ----
function setOnlineStatus() {
  const el = $('#net-status');
  if (!el) return;
  const online = navigator.onLine;
  el.textContent = online ? 'Online' : 'Offline';
  el.classList.toggle('online', online);
  el.classList.toggle('offline', !online);
}
function initNetStatus() {
  setOnlineStatus();
  window.addEventListener('online', setOnlineStatus);
  window.addEventListener('offline', setOnlineStatus);
}

// ---- Tabs ----
function showTab(tab) {
  // Hide all panes
  $all('.tab-pane').forEach(pane => {
    pane.classList.remove('active');
    pane.hidden = true;
  });

  // Show selected pane
  const pane = $(`#tab-${tab}`);
  if (pane) {
    pane.hidden = false;
    pane.classList.add('active');
  }

  // Update bottom tab active state
  $all('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  // Close More sheet if open
  hideMore();

  State.activeTab = tab;
  try { localStorage.setItem('lastTab', tab); } catch (_) {}
}

function initTabs() {
  // Bottom nav buttons
  $all('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.tab;
      if (t === 'more') { openMore(); return; }
      showTab(t);
    });
  });

  // More panel items
  $all('.more-item').forEach(item => {
    item.addEventListener('click', () => {
      const t = item.dataset.tab;
      showTab(t);
    });
  });

  // More panel close/backdrop
  $('#more-close')?.addEventListener('click', hideMore);
  $('#more-backdrop')?.addEventListener('click', hideMore);

  // Restore last tab
  let last = 'quotes';
  try {
    const saved = localStorage.getItem('lastTab');
    if (saved) last = saved;
  } catch (_) {}
  showTab(last);
}

// ---- More sheet ----
function openMore() {
  const panel = $('#more-panel');
  if (panel) panel.removeAttribute('hidden');
}
function hideMore() {
  const panel = $('#more-panel');
  if (panel) panel.setAttribute('hidden', '');
}

// ---- Minimal placeholder mount (safe to remove later) ----
function mountPlaceholders() {
  const fillers = {
    quotes: 'Start your quote flow here.',
    presets: 'Your saved presets will appear here.',
    customers: 'Customer list & quick search.',
    analytics: 'KPIs & date-range reports.',
    settings: 'Language, currency, role.',
    business: 'Business name, logo, contact, financial defaults.',
    resources: 'Employees, sublets, suppliers.'
  };
  Object.entries(fillers).forEach(([key, text]) => {
    const el = $(`#tab-${key}`);
    if (el && !el.dataset.mounted) {
      const block = document.createElement('div');
      block.className = 'placeholder';
      block.textContent = text;
      el.appendChild(block);
      el.dataset.mounted = '1';
    }
  });
}

// ---- Boot ----
document.addEventListener('DOMContentLoaded', () => {
  initNetStatus();
  initTabs();
  mountPlaceholders();
});