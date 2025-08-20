// ---------- Utilities ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Network badge
function updateNet() {
  const el = $("#net");
  if (!el) return;
  const on = navigator.onLine;
  el.textContent = on ? "Online" : "Offline";
  el.className = "pill " + (on ? "ok" : "warn");
}
addEventListener("online", updateNet);
addEventListener("offline", updateNet);
updateNet();

// ---------- Tabs ----------
function showTab(name) {
  $$(".tab").forEach(p => p.classList.remove("active"));
  const pane = $("#tab-" + name);
  if (pane) pane.classList.add("active");

  $$(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  localStorage.setItem("lastTab", name);

  // Close More if open
  const dlg = $("#more-dialog");
  if (dlg?.open) dlg.close();
}

function initTabs() {
  $$(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const t = btn.dataset.tab;
      if (t === "more") {
        $("#more-dialog").showModal();
      } else {
        showTab(t);
      }
    }, { passive: true });
  });

  // Wire sheet items to tabs
  $$("#more-dialog .sheet-item[data-tab]").forEach(item => {
    item.addEventListener("click", () => showTab(item.dataset.tab));
  });
  $("#close-more")?.addEventListener("click", () => $("#more-dialog").close());

  // Restore last tab
  showTab(localStorage.getItem("lastTab") || "quotes");
}
initTabs();

// ---------- Force Update ----------
$("#force-update")?.addEventListener("click", async () => {
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    localStorage.removeItem("lastTab");
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
    }
  } catch (e) {
    console.warn("forceUpdate error", e);
  }
  location.reload();
});

// ---------- Service Worker ----------
(function registerSW() {
  const swBadge = $("#sw");
  if (!("serviceWorker" in navigator)) {
    if (swBadge) swBadge.textContent = "SW: unsupported";
    return;
  }
  navigator.serviceWorker.register("./service-worker.js")
    .then(reg => {
      if (swBadge) swBadge.textContent = "SW: registered";
      // Optional: listen for updates
      reg.addEventListener("updatefound", () => {
        // could surface UI later
      });
    })
    .catch(err => {
      if (swBadge) swBadge.textContent = "SW: failed";
      console.error("SW register failed:", err);
    });
})();

// ---------- Install prompt (native-like) ----------
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  // Chrome sometimes suppresses auto UI; we prompt immediately
  e.preventDefault();
  deferredPrompt = e;
  // small delay so it doesn't race with first paint
  setTimeout(async () => {
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch (_) {}
    deferredPrompt = null;
  }, 300);
});