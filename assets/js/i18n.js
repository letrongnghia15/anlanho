/* =====================================================================
   i18n.js — Bilingual engine (EN default for SEO, VI for community)
   Approach: JSON dictionaries swapped client-side. Elements opt in via
   data-i18n="key" (text) or data-i18n-attr="placeholder:key,title:key".
   Choice persisted in localStorage. Vietnamese diacritics come straight
   from vi.json (UTF-8), so they always render correctly.
   ===================================================================== */
(function () {
  "use strict";

  // Resolve base path so /pages/*.html and / both find /i18n + /data.
  // Each page sets <body data-base="./"> (root) or "../" (in /pages).
  const BASE = document.body.getAttribute("data-base") || "./";
  window.SITE_BASE = BASE;

  const STORAGE_KEY = "aln_lang";
  const SUPPORTED = ["en", "vi"];
  const cache = {};
  let current = "en";

  function preferredLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
    // Honor browser language on first visit; default English for SEO.
    const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    return SUPPORTED.includes(nav) ? nav : "en";
  }

  async function loadDict(lang) {
    if (cache[lang]) return cache[lang];
    const res = await fetch(`${BASE}i18n/${lang}.json`, { cache: "no-cache" });
    if (!res.ok) throw new Error(`i18n load failed: ${lang}`);
    cache[lang] = await res.json();
    return cache[lang];
  }

  function apply(dict) {
    // Text nodes
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key] != null) el.textContent = dict[key];
    });
    // Attributes: data-i18n-attr="placeholder:key,aria-label:key"
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      el.getAttribute("data-i18n-attr").split(",").forEach((pair) => {
        const [attr, key] = pair.split(":").map((s) => s.trim());
        if (attr && key && dict[key] != null) el.setAttribute(attr, dict[key]);
      });
    });
    // <html lang> + the language toggle label show the OTHER language
    document.documentElement.lang = current;
    const toggle = document.querySelector("[data-lang-toggle]");
    if (toggle) toggle.textContent = dict["nav.lang"];
  }

  async function setLang(lang, persist = true) {
    if (!SUPPORTED.includes(lang)) lang = "en";
    current = lang;
    if (persist) localStorage.setItem(STORAGE_KEY, lang);
    const dict = await loadDict(lang);
    window.I18N = { lang, dict, t: (k) => dict[k] ?? k };
    apply(dict);
    // Let page scripts (shop/product) re-render localized content.
    document.dispatchEvent(new CustomEvent("i18n:changed", { detail: { lang, dict } }));
  }

  // Expose a tiny API for other scripts.
  window.ALN_I18N = {
    get lang() { return current; },
    t: (k) => (window.I18N ? window.I18N.t(k) : k),
    set: setLang,
    ready: setLang(preferredLang(), false), // promise other scripts can await
  };

  // Wire up any language toggle buttons.
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-lang-toggle]");
    if (!btn) return;
    setLang(current === "en" ? "vi" : "en");
  });
})();
