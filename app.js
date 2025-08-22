// --- Tab navigation ---
const tabButtons = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    if (!tab) return; // skip kabob
    tabButtons.forEach(b => b.classList.remove("active"));
    tabContents.forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${tab}`).classList.add("active");
    localStorage.setItem("lastTab", tab);
  });
});

// Restore last tab
const lastTab = localStorage.getItem("lastTab");
if (lastTab) {
  document.querySelector(`.tab-button[data-tab="${lastTab}"]`)?.click();
}

// --- More menu ---
const moreBtn = document.getElementById("more-button");
const moreDialog = document.getElementById("more-dialog");
const closeMore = document.getElementById("close-more");

moreBtn.addEventListener("click", () => moreDialog.showModal());
closeMore.addEventListener("click", () => moreDialog.close());

// --- Settings form ---
const languageSelect = document.getElementById("language-select");
const settingsForm = document.getElementById("settings-form");

function applyLanguage(lang) {
  document.documentElement.lang = lang;
}

settingsForm.addEventListener("submit", e => {
  e.preventDefault();
  const lang = languageSelect.value;
  localStorage.setItem("language", lang);
  applyLanguage(lang);
  alert("Settings saved!");
});

const savedLang = localStorage.getItem("language") || "en";
languageSelect.value = savedLang;
applyLanguage(savedLang);

// --- Seed demo ---
const seedCountEl = document.getElementById("seed-count");
let seedCount = parseInt(localStorage.getItem("seedCount") || "0");
seedCountEl.textContent = seedCount;

document.getElementById("seed-add").addEventListener("click", () => {
  seedCount++;
  seedCountEl.textContent = seedCount;
  localStorage.setItem("seedCount", seedCount);
});

document.getElementById("seed-clear").addEventListener("click", () => {
  seedCount = 0;
  seedCountEl.textContent = seedCount;
  localStorage.setItem("seedCount", seedCount);
});

// --- Online/offline ---
const onlineStatus = document.getElementById("online-status");
function updateOnlineStatus() {
  onlineStatus.textContent = navigator.onLine ? "Online" : "Offline";
}
window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);
updateOnlineStatus();

// --- Service worker ---
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").then(reg => {
    document.getElementById("sw-status").textContent = "SW: registered";
  }).catch(err => {
    document.getElementById("sw-status").textContent = "SW: error";
    console.error(err);
  });
}