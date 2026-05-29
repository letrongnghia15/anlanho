/* =====================================================================
   i18n.js — Bilingual engine (EN default for SEO, VI for community)
   Both language files are fetched in parallel at startup so switching
   is instant and synchronous — no async fetch on button click.
   ===================================================================== */
(function () {
  "use strict";

  const BASE = document.body.getAttribute("data-base") || "./";
  window.SITE_BASE = BASE;

  const STORAGE_KEY = "aln_lang";
  const SUPPORTED = ["en", "vi"];
  const dicts = {};
  let current = "en";

  function preferredLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
    const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    return SUPPORTED.includes(nav) ? nav : "en";
  }

  function apply(dict) {
    // Text content
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (dict[key] != null) el.textContent = dict[key];
    });
    // Attributes: data-i18n-attr="placeholder:key,aria-label:key"
    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(",").forEach(function (pair) {
        var parts = pair.split(":");
        var attr = parts[0] && parts[0].trim();
        var key  = parts[1] && parts[1].trim();
        if (attr && key && dict[key] != null) el.setAttribute(attr, dict[key]);
      });
    });
    // html[lang]
    document.documentElement.lang = current;
    // Mark active lang button
    document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
      var isActive = btn.getAttribute("data-lang-btn") === current;
      btn.setAttribute("aria-pressed", String(isActive));
      btn.classList.toggle("lang-btn--active", isActive);
    });
    // Legacy toggle label
    var toggle = document.querySelector("[data-lang-toggle]");
    if (toggle && dict["nav.lang"]) toggle.textContent = dict["nav.lang"];
  }

  // Synchronous switch — dict must already be loaded.
  function switchTo(lang) {
    if (!SUPPORTED.includes(lang)) lang = "en";
    var dict = dicts[lang] || dicts["en"];
    if (!dict) return; // nothing loaded yet
    current = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    window.I18N = { lang: lang, dict: dict, t: function (k) { return dict[k] != null ? dict[k] : k; } };
    apply(dict);
    document.dispatchEvent(new CustomEvent("i18n:changed", { detail: { lang: lang, dict: dict } }));
  }

  // Expose API (set() is now synchronous once dicts are loaded).
  window.ALN_I18N = {
    get lang() { return current; },
    t: function (k) { return window.I18N ? window.I18N.t(k) : k; },
    set: switchTo,
    ready: null // set below after preload
  };

  // Wire click handlers directly — no event delegation.
  document.querySelectorAll("[data-lang-btn]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      switchTo(btn.getAttribute("data-lang-btn"));
    });
  });
  var legacyToggle = document.querySelector("[data-lang-toggle]");
  if (legacyToggle) {
    legacyToggle.addEventListener("click", function () {
      switchTo(current === "en" ? "vi" : "en");
    });
  }

  // Preload both language files in parallel, then apply the preferred one.
  var initialLang = preferredLang();
  var loadPromises = SUPPORTED.map(function (lang) {
    return fetch(BASE + "i18n/" + lang + ".json")
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        dicts[lang] = data;
      })
      .catch(function (err) {
        console.warn("[i18n] Could not load " + lang + ".json:", err);
      });
  });

  var ready = Promise.all(loadPromises).then(function () {
    switchTo(initialLang);
  });

  window.ALN_I18N.ready = ready;
})();
