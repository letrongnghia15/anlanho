/* =====================================================================
   main.js — shared site behavior (loaded with `defer` on every page)
   No framework. Progressive enhancement: the site works without JS;
   this just adds interactivity (menu, cart badge, reveals, banners).
   ===================================================================== */
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");

  /* ---- Mobile nav drawer ---- */
  const menuBtn = document.querySelector("[data-menu-open]");
  const drawer = document.querySelector("[data-mobile-nav]");
  const overlay = document.querySelector("[data-nav-overlay]");
  function setMenu(open) {
    if (!drawer || !overlay) return;
    drawer.classList.toggle("open", open);
    overlay.classList.toggle("open", open);
    if (menuBtn) menuBtn.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  }
  if (menuBtn) menuBtn.addEventListener("click", () => setMenu(!drawer.classList.contains("open")));
  if (overlay) overlay.addEventListener("click", () => setMenu(false));
  document.querySelectorAll("[data-mobile-nav] a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* ---- Mark current nav link ---- */
  const here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a, .mobile-nav a").forEach((a) => {
    const target = a.getAttribute("href") || "";
    if (target.endsWith(here) && here !== "") a.setAttribute("aria-current", "page");
  });

  /* ---- Cart count: synced from Snipcart when present ---- */
  const counters = document.querySelectorAll("[data-cart-count]");
  function setCount(n) {
    counters.forEach((c) => { c.textContent = n > 0 ? n : ""; c.setAttribute("data-count", n); });
  }
  // Snipcart fires events once its SDK loads. Until then, badge is empty.
  document.addEventListener("snipcart.ready", () => {
    try {
      const store = window.Snipcart.store;
      const update = () => setCount(window.Snipcart.store.getState().cart.items.count || 0);
      update();
      store.subscribe(update);
    } catch (_) {}
  });
  // Add-to-cart visual feedback (works even before Snipcart loads)
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".snipcart-add-item, [data-cart-pop]");
    if (b) { b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); }
  });

  /* ---- Reveal on scroll ---- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  /* ---- Cookie consent (shown once; stored locally) ---- */
  const banner = document.querySelector("[data-cookie]");
  if (banner && !localStorage.getItem("aln_cookie")) {
    setTimeout(() => banner.classList.add("show"), 900);
    banner.addEventListener("click", (e) => {
      const choice = e.target.getAttribute("data-cookie-choice");
      if (!choice) return;
      localStorage.setItem("aln_cookie", choice);
      banner.classList.remove("show");
      // If you load GA4/GTM only after consent, trigger it here when choice==="accept".
      if (choice === "accept") document.dispatchEvent(new CustomEvent("consent:granted"));
    });
  }

  /* ---- Newsletter (Formspree-ready, AJAX, no redirect) ---- */
  document.querySelectorAll("form[data-ajax-form]").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      // Honeypot: if filled, silently drop (likely a bot).
      const hp = form.querySelector(".hp input");
      if (hp && hp.value) return;
      const btn = form.querySelector("[type=submit]");
      const success = form.querySelector(".form-success");
      const endpoint = form.getAttribute("action");
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = "…"; }
      try {
        // If no real endpoint configured yet, just show success (demo mode).
        if (endpoint && endpoint.includes("formspree.io") && !endpoint.includes("YOUR_FORM_ID")) {
          const res = await fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
          if (!res.ok) throw new Error("submit failed");
        }
        form.reset();
        if (success) { success.style.display = "block"; success.scrollIntoView({ behavior: "smooth", block: "center" }); }
        else { alert("Thanks! We'll be in touch."); }
      } catch (err) {
        alert("Sorry — something went wrong. Please email us directly.");
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; }
      }
    });
  });

  /* ---- Footer year ---- */
  const y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
