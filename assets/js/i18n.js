/* i18n.js — reads from window.ALN_DICTS (set by i18n-data.js).
   No network requests. Language switch is synchronous. */
(function () {
  "use strict";

  const BASE = document.body.getAttribute("data-base") || "./";
  window.SITE_BASE = BASE;

  const STORAGE_KEY = "aln_lang";
  const SUPPORTED = ["en", "vi"];
  const dicts = window.ALN_DICTS || {};
  let current = "en";

  function preferredLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
    const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    return SUPPORTED.includes(nav) ? nav : "en";
  }

  function apply(dict) {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      const key = el.getAttribute("data-i18n");
      if (dict[key] != null) el.textContent = dict[key];
    });
    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(",").forEach(function (pair) {
        const parts = pair.split(":");
        const attr = parts[0] && parts[0].trim();
        const key  = parts[1] && parts[1].trim();
        if (attr && key && dict[key] != null) el.setAttribute(attr, dict[key]);
      });
    });
    document.documentElement.lang = current;
    document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
      const isActive = btn.getAttribute("data-lang-btn") === current;
      btn.setAttribute("aria-pressed", String(isActive));
      btn.classList.toggle("lang-btn--active", isActive);
    });
    const toggle = document.querySelector("[data-lang-toggle]");
    if (toggle && dict["nav.lang"]) toggle.textContent = dict["nav.lang"];
  }

  function switchTo(lang) {
    if (!SUPPORTED.includes(lang)) lang = "en";
    const dict = dicts[lang] || dicts["en"];
    if (!dict) return;
    current = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    window.I18N = { lang: lang, dict: dict, t: function (k) { return dict[k] != null ? dict[k] : k; } };
    apply(dict);
    document.dispatchEvent(new CustomEvent("i18n:changed", { detail: { lang: lang, dict: dict } }));
  }

  // Apply initial language immediately (synchronous — no fetch).
  switchTo(preferredLang());

  // Expose API.
  window.ALN_I18N = {
    get lang() { return current; },
    t: function (k) { return window.I18N ? window.I18N.t(k) : k; },
    set: switchTo,
    ready: Promise.resolve()
  };

  // Wire buttons directly.
  document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      switchTo(btn.getAttribute("data-lang-btn"));
    });
  });
  const legacyToggle = document.querySelector("[data-lang-toggle]");
  if (legacyToggle) {
    legacyToggle.addEventListener("click", function () {
      switchTo(current === "en" ? "vi" : "en");
    });
  }
})();
