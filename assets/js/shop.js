/* =====================================================================
   shop.js — Renders the product grid from data/products.json and powers
   the filters. Re-renders on language change. Owner adds products by
   editing products.json only — no code changes needed.
   ===================================================================== */
(function () {
  "use strict";

  const grid = document.querySelector("[data-shop-grid]");
  if (!grid) return;
  const BASE = window.SITE_BASE || "./";
  const empty = document.querySelector("[data-shop-empty]");

  let DATA = null;
  const filters = { spice: "all", size: "all", vegan: false };

  const money = (n, cur) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: cur || "USD" }).format(n);

  function spiceMeter(level) {
    let pips = "";
    for (let i = 1; i <= 5; i++) pips += `<span class="pip ${i <= level ? "on" : ""}"></span>`;
    return `<span class="spicemeter" aria-hidden="true">${pips}</span>`;
  }

  function card(p) {
    const lang = window.ALN_I18N ? window.ALN_I18N.lang : "en";
    const t = (k) => (window.ALN_I18N ? window.ALN_I18N.t(k) : k);
    const name = lang === "vi" ? p.name_vi : p.name_en;
    const altName = lang === "vi" ? p.name_en : p.name_vi;
    const size = lang === "vi" ? p.size_vi : p.size_en;
    const out = p.stock === 0;
    const onSale = p.compare_at && p.compare_at > p.price;
    const url = `${BASE}pages/product.html?sku=${encodeURIComponent(p.sku)}`;

    const flags = [];
    if (out) flags.push(`<span class="badge badge--out">${t("cta.soldout")}</span>`);
    if (onSale) flags.push(`<span class="badge badge--sale">SALE</span>`);
    if (p.vegan) flags.push(`<span class="badge badge--vegan">${t("shop.filter.vegan")}</span>`);

    // Snipcart add-to-cart button. data-item-url must be crawlable for price
    // validation (see README — use build.py or disable validation in test mode).
    const buy = out
      ? `<button class="btn btn--sm" disabled>${t("cta.soldout")}</button>`
      : `<button class="btn btn--sm snipcart-add-item"
            data-item-id="${p.sku}"
            data-item-price="${p.price}"
            data-item-url="${url}"
            data-item-name="${name.replace(/"/g, "&quot;")}"
            data-item-description="${(p.tagline_en || "").replace(/"/g, "&quot;")}"
            data-item-image="${p.image_card}"
            data-item-weight="${p.weight_g}"
            data-item-custom1-name="Size"
            data-item-custom1-value="${(size || "").replace(/"/g, "&quot;")}">
            ${t("cta.addcart")}
         </button>`;

    return `
      <article class="product-card reveal">
        <a class="media" href="${url}" aria-label="${name}">
          <img src="${p.image_card}" alt="${name} — ${p.tagline_en || ""}" width="600" height="600" loading="lazy" decoding="async">
          <span class="flags">${flags.join("")}</span>
        </a>
        <div class="body">
          <a href="${url}"><h3>${name}</h3></a>
          <span class="pname-vi">${altName}</span>
          <div class="meta">
            <span title="${t("shop.spice")}: ${t("spice." + p.spice)}">${spiceMeter(p.spice)}</span>
            <span class="muted" style="font-size:var(--fs-xs)">${size}</span>
          </div>
          <div class="meta">
            <span class="price">${money(p.price, DATA.currency)}${onSale ? `<s>${money(p.compare_at, DATA.currency)}</s>` : ""}</span>
          </div>
          <div class="actions">
            <a class="btn btn--ghost btn--sm" href="${url}">${t("cta.viewproduct")}</a>
            ${buy}
          </div>
        </div>
      </article>`;
  }

  function passes(p) {
    if (filters.spice !== "all") {
      if (filters.spice === "mild" && p.spice > 2) return false;
      if (filters.spice === "hot" && p.spice < 3) return false;
    }
    if (filters.size !== "all") {
      if (filters.size === "single" && p.weight_g > 200) return false;
      if (filters.size === "multi" && p.weight_g <= 200) return false;
    }
    if (filters.vegan && !p.vegan) return false;
    return true;
  }

  function render() {
    if (!DATA) return;
    const list = DATA.products.filter(passes);
    grid.innerHTML = list.map(card).join("");
    if (empty) empty.style.display = list.length ? "none" : "block";
    // newly added .reveal nodes
    grid.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
  }

  // Filter controls
  document.querySelectorAll("[data-filter]").forEach((ctrl) => {
    ctrl.addEventListener("change", () => {
      const key = ctrl.getAttribute("data-filter");
      filters[key] = ctrl.type === "checkbox" ? ctrl.checked : ctrl.value;
      render();
    });
  });
  const clear = document.querySelector("[data-filter-clear]");
  if (clear) clear.addEventListener("click", () => {
    filters.spice = "all"; filters.size = "all"; filters.vegan = false;
    document.querySelectorAll("[data-filter]").forEach((c) => { if (c.type === "checkbox") c.checked = false; else c.value = "all"; });
    render();
  });

  // Load data, then render after i18n is ready.
  fetch(`${BASE}data/products.json`, { cache: "no-cache" })
    .then((r) => r.json())
    .then((json) => { DATA = json; return window.ALN_I18N ? window.ALN_I18N.ready : null; })
    .then(render)
    .catch(() => { if (empty) { empty.style.display = "block"; empty.textContent = "Could not load products."; } });

  document.addEventListener("i18n:changed", render);
})();
