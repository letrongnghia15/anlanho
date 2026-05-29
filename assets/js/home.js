/* home.js — renders the "Fan favorites" featured grid on the homepage. */
(function () {
  "use strict";
  const grid = document.querySelector("[data-featured-grid]");
  if (!grid) return;
  const BASE = window.SITE_BASE || "./";
  let DATA = null;

  const money = (n, cur) => new Intl.NumberFormat(undefined, { style: "currency", currency: cur || "USD" }).format(n);
  function spiceMeter(l){let p="";for(let i=1;i<=5;i++)p+=`<span class="pip ${i<=l?"on":""}"></span>`;return `<span class="spicemeter" aria-hidden="true">${p}</span>`;}

  function card(p) {
    const lang = window.ALN_I18N ? window.ALN_I18N.lang : "en";
    const t = (k) => (window.ALN_I18N ? window.ALN_I18N.t(k) : k);
    const name = lang === "vi" ? p.name_vi : p.name_en;
    const tagline = lang === "vi" ? p.tagline_vi : p.tagline_en;
    const out = p.stock === 0;
    const url = `${BASE}pages/product.html?sku=${encodeURIComponent(p.sku)}`;
    const buy = out
      ? `<button class="btn btn--sm" disabled>${t("cta.soldout")}</button>`
      : `<button class="btn btn--sm snipcart-add-item" data-item-id="${p.sku}" data-item-price="${p.price}" data-item-url="${url}" data-item-name="${name.replace(/"/g,"&quot;")}" data-item-description="${(p.tagline_en||"").replace(/"/g,"&quot;")}" data-item-image="${p.image_card}" data-item-weight="${p.weight_g}">${t("cta.addcart")}</button>`;
    return `<article class="product-card reveal">
      <a class="media" href="${url}" aria-label="${name}">
        <img src="${p.image_card}" alt="${name} — ${tagline}" width="600" height="600" loading="lazy" decoding="async">
        ${out?`<span class="flags"><span class="badge badge--out">${t("cta.soldout")}</span></span>`:""}
      </a>
      <div class="body">
        <a href="${url}"><h3>${name}</h3></a>
        <span class="pname-vi">${tagline}</span>
        <div class="meta"><span>${spiceMeter(p.spice)}</span><span class="price">${money(p.price,DATA.currency)}</span></div>
        <div class="actions"><a class="btn btn--ghost btn--sm" href="${url}">${t("cta.viewproduct")}</a>${buy}</div>
      </div>
    </article>`;
  }

  function render() {
    if (!DATA) return;
    const feat = DATA.products.filter((p) => p.featured).slice(0, 4);
    grid.innerHTML = feat.map(card).join("");
    grid.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
  }

  fetch(`${BASE}data/products.json`, { cache: "no-cache" })
    .then((r) => r.json())
    .then((j) => { DATA = j; return window.ALN_I18N ? window.ALN_I18N.ready : null; })
    .then(render).catch(() => {});
  document.addEventListener("i18n:changed", render);
})();
