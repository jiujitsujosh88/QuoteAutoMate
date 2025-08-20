// --- Tab switching ---
document.querySelectorAll(".tab-button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// --- More menu ---
const moreDialog = document.getElementById("more-dialog");
document.getElementById("more-btn").addEventListener("click", () => {
  moreDialog.showModal();
});
document.getElementById("close-more").addEventListener("click", () => {
  moreDialog.close();
});

// --- Reset app ---
document.getElementById("reset-app").addEventListener("click", () => {
  if ('caches' in window) {
    caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
  }
  localStorage.clear();
  sessionStorage.clear();
  location.reload(true);
});

// --- Service Worker registration ---
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(reg => {
      document.getElementById("sw-status").textContent = "SW: registered";
      console.log("SW registered", reg);
    })
    .catch(err => {
      document.getElementById("sw-status").textContent = "SW: failed";
      console.error("SW failed", err);
    });
} else {
  document.getElementById("sw-status").textContent = "SW: not supported";
}

// --- Install prompt (native, not button) ---
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Auto-show the prompt (like Chrome did in your last build)
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(choice => {
    console.log("Install choice:", choice);
  });
});