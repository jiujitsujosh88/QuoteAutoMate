// Minimal functionality restore
document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab-button[data-tab]");
  const contents = document.querySelectorAll(".tab-content");

  function showTab(name) {
    contents.forEach(c => c.classList.remove("active"));
    document.getElementById("tab-" + name)?.classList.add("active");

    tabs.forEach(b => b.classList.toggle("active", b.dataset.tab === name));
    localStorage.setItem("lastTab", name);
  }

  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.tab) showTab(btn.dataset.tab);
      else if (btn.id === "more-button") document.getElementById("more-dialog").showModal();
    });
  });

  document.getElementById("close-more")
    ?.addEventListener("click", () => document.getElementById("more-dialog").close());

  const saved = localStorage.getItem("lastTab");
  showTab(saved || "quote");

  // Restore settings functionality
  const langSelect = document.getElementById("language-select");
  const savedLang = localStorage.getItem("language") || "en";
  if (langSelect) {
    langSelect.value = savedLang;
    langSelect.addEventListener("change", () => {
      localStorage.setItem("language", langSelect.value);
      alert("Language saved!");
    });
  }

  // Restore seed
  const seedCountEl = document.getElementById("seed-count");
  let c = parseInt(localStorage.getItem("seedCount") || "0");
  if (seedCountEl) seedCountEl.textContent = c;
  document.getElementById("seed-add")
    ?.addEventListener("click", () => {
      c++;
      seedCountEl.textContent = c;
      localStorage.setItem("seedCount", c);
    });
  document.getElementById("seed-clear")
    ?.addEventListener("click", () => {
      c = 0;
      seedCountEl.textContent = c;
      localStorage.setItem("seedCount", c);
    });
});