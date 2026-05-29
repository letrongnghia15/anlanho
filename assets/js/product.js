/* =====================================================================
   product.js — Renders the product detail page from data/products.json
   based on the ?sku= query param. Builds gallery, specs, reviews, the
   Snipcart buy button, Product JSON-LD, and updates SEO meta/canonical.
   ===================================================================== */
(function () {
  "use strict";
  const root = document.querySelector("[data-product]");
  if (!root) return;
  const BASE = window.SITE_BASE || "./";
  const params = new URLSearchParams(location.search);
  const sku = params.get("sku");

  let DATA = null, P = null;

  const money = (n, cur) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: cur || "USD" }).format(n);
  const esc = (s) => String(s == null ? "" : s).replace(/"/g, "&quot;");

  function reviewsFor(s) { return (DATA.reviews || []).filter((r) => r.sku === s); }
  function avgRating(s) {
    const rs = reviewsFor(s); if (!rs.length) return null;
    return (rs.reduce((a, r) => a + r.rating, 0) / rs.length);
  }

  function spiceMeter(level) {
    let pips = "";
    for (let i = 1; i <= 5; i++) pips += `<span class="pip ${i <= level ? "on" : ""}"></span>`;
    return `<span class="spicemeter" aria-hidden="true">${pips}</span>`;
  }

  function render() {
    if (!P) {
      root.innerHTML = `<div class="wrap section center"><p>${window.ALN_I18N ? window.ALN_I18N.t("product.notfound") : "Product not found."}</p><p><a class="link-arrow" href="${BASE}pages/shop.html">${window.ALN_I18N ? window.ALN_I18N.t("product.back") : "Back to shop"}</a></p></div>`;
      return;
    }
    const lang = window.ALN_I18N ? window.ALN_I18N.lang : "en";
    const t = (k) => (window.ALN_I18N ? window.ALN_I18N.t(k) : k);
    const name = lang === "vi" ? P.name_vi : P.name_en;
    const altName = lang === "vi" ? P.name_en : P.name_vi;
    const desc = lang === "vi" ? P.description_vi : P.description_en;
    const ingr = lang === "vi" ? P.ingredients_vi : P.ingredients_en;
    const aller = lang === "vi" ? P.allergens_vi : P.allergens_en;
    const size = lang === "vi" ? P.size_vi : P.size_en;
    const shelf = lang === "vi" ? P.shelf_life_vi : P.shelf_life_en;
    const out = P.stock === 0;
    const onSale = P.compare_at && P.compare_at > P.price;
    const url = `${location.origin}${location.pathname}?sku=${encodeURIComponent(P.sku)}`;
    const rating = avgRating(P.sku);
    const rs = reviewsFor(P.sku);

    // Update document SEO
    document.title = `${P.name_en} | Ăn Là Nhớ`;
    setMeta("description", P.description_en.slice(0, 155));
    setLink("canonical", url);
    setMeta("og:title", P.name_en, true);
    setMeta("og:description", P.description_en.slice(0, 155), true);
    setMeta("og:image", P.image_card.replace("../", BASE), true);

    const gallery = P.images.map((src, i) =>
      `<button aria-pressed="${i === 0}" data-thumb="${src}"><img src="${src}" alt="${esc(name)} view ${i + 1}" width="140" height="140" loading="lazy"></button>`
    ).join("");

    const buy = out
      ? `<button class="btn btn--lg" disabled>${t("cta.soldout")}</button>`
      : `<button class="btn snipcart-add-item" data-cart-pop
            data-item-id="${P.sku}"
            data-item-price="${P.price}"
            data-item-url="${url}"
            data-item-name="${esc(name)}"
            data-item-description="${esc(P.tagline_en)}"
            data-item-image="${P.image_card}"
            data-item-weight="${P.weight_g}"
            data-item-custom1-name="Size"
            data-item-custom1-value="${esc(size)}"
            data-item-quantity="1" data-item-quantity-step="1" data-item-min-quantity="1"
         >${t("cta.addcart")}</button>`;

    const dietBadges = [];
    if (P.vegan) dietBadges.push(`<span class="badge badge--vegan">${t("shop.filter.vegan")}</span>`);
    if (P.halal) dietBadges.push(`<span class="badge">Halal</span>`);

    root.innerHTML = `
      <div class="wrap section">
        <p style="margin-bottom:1rem"><a class="link-arrow" href="${BASE}pages/shop.html">${t("product.back")}</a></p>
        <div class="pd-grid">
          <div class="pd-gallery">
            <div class="main"><img id="pd-main" src="${P.images[0]}" alt="${esc(name)}" width="800" height="800"></div>
            ${P.images.length > 1 ? `<div class="pd-thumbs">${gallery}</div>` : ""}
          </div>
          <div class="pd-info">
            <div class="flags" style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.6rem">
              ${out ? `<span class="badge badge--out">${t("cta.soldout")}</span>` : ""}
              ${onSale ? `<span class="badge badge--sale">SALE</span>` : ""}
              ${dietBadges.join("")}
            </div>
            <h1>${name}</h1>
            <div class="pname-vi">${altName}</div>
            ${rating ? `<p class="stars" style="margin-top:.5rem">${"★".repeat(Math.round(rating))}<span class="muted" style="font-size:var(--fs-sm);margin-left:.4rem">${rating.toFixed(1)} · ${rs.length} ${t("product.reviews")}</span></p>` : ""}
            <div class="pd-price">${money(P.price, DATA.currency)}${onSale ? `<s>${money(P.compare_at, DATA.currency)}</s>` : ""}</div>
            <p>${desc}</p>
            <div class="pd-buy">
              <div class="qty" ${out ? "hidden" : ""}>
                <button type="button" data-qty="-1" aria-label="Decrease quantity">−</button>
                <input id="pd-qty" type="number" value="1" min="1" max="20" aria-label="${t("product.qty")}">
                <button type="button" data-qty="1" aria-label="Increase quantity">+</button>
              </div>
              ${buy}
            </div>
            <div class="pd-specs">
              <details open>
                <summary>${t("product.ingredients")}</summary>
                <div class="spec-body">${ingr}</div>
              </details>
              <details>
                <summary>${t("product.allergens")}</summary>
                <div class="spec-body">${aller}</div>
              </details>
              <details>
                <summary>Details</summary>
                <div class="spec-body">
                  <dl>
                    <div class="specrow"><dt>${t("product.weight")}</dt><dd>${size}</dd></div>
                    <div class="specrow"><dt>${t("product.spice")}</dt><dd>${spiceMeter(P.spice)} ${t("spice." + P.spice)}</dd></div>
                    <div class="specrow"><dt>${t("product.shelf")}</dt><dd>${shelf}</dd></div>
                    <div class="specrow"><dt>SKU</dt><dd>${P.sku}</dd></div>
                  </dl>
                </div>
              </details>
              <details>
                <summary>${t("product.shipping")}</summary>
                <div class="spec-body">${t("product.shipping.d")}</div>
              </details>
            </div>
          </div>
        </div>

        ${rs.length ? `
        <section class="section--tight" aria-label="${t("product.reviews")}">
          <h2 style="margin-bottom:1rem">${t("product.reviews")}</h2>
          <div class="grid grid--3">
            ${rs.map((r) => `
              <div class="review">
                <div class="stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</div>
                <div class="title">${r.title_en}</div>
                <p style="font-size:var(--fs-sm)">${r.body_en}</p>
                <div class="who muted" style="margin-top:.5rem;font-size:var(--fs-xs)">— ${r.author}</div>
              </div>`).join("")}
          </div>
        </section>` : ""}
      </div>`;

    wireGallery();
    wireQty();
    injectJsonLd(P, rating, rs, url);
  }

  function wireGallery() {
    const main = document.getElementById("pd-main");
    root.querySelectorAll("[data-thumb]").forEach((b) => {
      b.addEventListener("click", () => {
        main.src = b.getAttribute("data-thumb");
        root.querySelectorAll("[data-thumb]").forEach((x) => x.setAttribute("aria-pressed", "false"));
        b.setAttribute("aria-pressed", "true");
      });
    });
  }
  function wireQty() {
    const input = document.getElementById("pd-qty");
    const buy = root.querySelector(".snipcart-add-item");
    if (!input) return;
    const sync = () => { if (buy) buy.setAttribute("data-item-quantity", input.value); };
    root.querySelectorAll("[data-qty]").forEach((b) => b.addEventListener("click", () => {
      const d = parseInt(b.getAttribute("data-qty"), 10);
      input.value = Math.max(1, Math.min(20, (parseInt(input.value, 10) || 1) + d));
      sync();
    }));
    input.addEventListener("change", sync);
  }

  function setMeta(name, content, isProp) {
    const sel = isProp ? `meta[property="${name}"]` : `meta[name="${name}"]`;
    let el = document.head.querySelector(sel);
    if (!el) { el = document.createElement("meta"); el.setAttribute(isProp ? "property" : "name", name); document.head.appendChild(el); }
    el.setAttribute("content", content);
  }
  function setLink(rel, href) {
    let el = document.head.querySelector(`link[rel="${rel}"]`);
    if (!el) { el = document.createElement("link"); el.setAttribute("rel", rel); document.head.appendChild(el); }
    el.setAttribute("href", href);
  }

  function injectJsonLd(p, rating, rs, url) {
    const old = document.getElementById("ld-product");
    if (old) old.remove();
    const ld = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": p.name_en,
      "image": [p.image_card.replace("../", location.origin + "/")],
      "description": p.description_en,
      "sku": p.sku,
      "brand": { "@type": "Brand", "name": "Ăn Là Nhớ" },
      "offers": {
        "@type": "Offer",
        "url": url,
        "priceCurrency": DATA.currency || "USD",
        "price": p.price.toFixed(2),
        "availability": p.stock === 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        "seller": { "@type": "Organization", "name": "TN Delicacy Distribution LLC" }
      }
    };
    if (rating && rs.length) {
      ld.aggregateRating = { "@type": "AggregateRating", "ratingValue": rating.toFixed(1), "reviewCount": rs.length };
      ld.review = rs.map((r) => ({
        "@type": "Review",
        "reviewRating": { "@type": "Rating", "ratingValue": r.rating, "bestRating": 5 },
        "author": { "@type": "Person", "name": r.author },
        "name": r.title_en, "reviewBody": r.body_en
      }));
    }
    const s = document.createElement("script");
    s.type = "application/ld+json"; s.id = "ld-product";
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);
  }

  fetch(`${BASE}data/products.json`, { cache: "no-cache" })
    .then((r) => r.json())
    .then((json) => { DATA = json; P = json.products.find((x) => x.sku === sku) || null; return window.ALN_I18N ? window.ALN_I18N.ready : null; })
    .then(render)
    .catch(() => { root.innerHTML = `<div class="wrap section center"><p>Could not load product.</p></div>`; });

  document.addEventListener("i18n:changed", render);
})();
