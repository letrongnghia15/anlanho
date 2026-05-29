# Ăn Là Nhớ — Authentic Tây Ninh Bánh Tráng Trộn

A fast, mobile-first, **bilingual (English default + Vietnamese)** static website for the brand **Ăn Là Nhớ** (legal entity **TN Delicacy Distribution LLC**). It sells the flagship product **Bánh tráng trộn Tây Ninh chính gốc** (authentic Tây Ninh Vietnamese spicy rice-paper salad snack) to two audiences:

- **B2C retail** — browse, add to cart, and check out online.
- **B2B wholesale** — distributors/retailers request pricing and download the line sheet.

The whole site is plain **HTML5 / CSS3 / vanilla JavaScript** — no build step required — so it runs on **GitHub Pages' free tier**. All "backend" work (payments, forms) is delegated to third-party services that work from static pages, with an optional serverless function you can deploy elsewhere.

---

## Table of contents

1. [Tech stack](#tech-stack)
2. [File tree](#file-tree)
3. [Quick start (local preview)](#quick-start-local-preview)
4. [Deploy to GitHub Pages](#deploy-to-github-pages)
5. [Custom domain + HTTPS](#custom-domain--https)
6. [Configure Snipcart (cart, checkout, payments)](#configure-snipcart-cart-checkout-payments)
7. [Configure Formspree (newsletter + wholesale form)](#configure-formspree-newsletter--wholesale-form)
8. [Editing products](#editing-products)
9. [Editing translations](#editing-translations)
10. [Analytics + Search Console](#analytics--search-console)
11. [Replace placeholder images & PDFs](#replace-placeholder-images--pdfs)
12. [Self-host fonts (recommended for production)](#self-host-fonts-recommended-for-production)
13. [Optional serverless shipping function](#optional-serverless-shipping-function)
14. [SEO notes & the Snipcart crawler caveat](#seo-notes--the-snipcart-crawler-caveat)
15. [Accessibility & performance](#accessibility--performance)
16. [What's built vs. still to come](#whats-built-vs-still-to-come)

---

## Tech stack

| Concern | Choice | Why |
|---|---|---|
| Hosting | **GitHub Pages** (static) | Free, fast, HTTPS, custom domain. No server code runs on the host. |
| Cart / checkout / payments | **Snipcart v3.7.0** (Stripe-backed) | Drop-in via `data-*` attributes. You paste only your **public** key — no secret keys in client code. |
| Forms (newsletter, wholesale lead) | **Formspree** + honeypot | Works from static pages, spam-filtered, emails you submissions. Optional hCaptcha. |
| Catalog | Single **`data/products.json`** rendered by JS | Non-developers edit one file to add/update products. |
| Bilingual (EN/VI) | JSON dictionaries (`i18n/en.json`, `i18n/vi.json`) swapped client-side, remembered in `localStorage` | No duplicate pages; instant toggle; Vietnamese diacritics throughout. |
| Optional custom shipping | `functions/shipping.js` serverless (deploy to Netlify/Vercel/Cloudflare — **not** GitHub Pages) | Only needed if you outgrow Snipcart's built-in shipping rules. |
| Fonts | **Fraunces** (display) + **Be Vietnam Pro** (body, full VN diacritics) | Distinctive food-brand feel; Be Vietnam Pro renders Vietnamese cleanly. |

---

## File tree

```
anlanho/
├── index.html                  # Home
├── CNAME                        # Custom domain for GitHub Pages (anlanho.com)
├── .nojekyll                    # Tell GitHub Pages to serve files as-is
├── robots.txt                   # Crawl rules + sitemap pointer
├── sitemap.xml                  # All URLs + hreflang alternates
├── README.md
│
├── pages/
│   ├── shop.html                # Catalog (filters, renders products.json)
│   ├── product.html             # Product detail (?sku=…), injects Product JSON-LD
│   └── wholesale.html           # B2B landing: terms table, line sheet, inquiry form
│
├── data/
│   └── products.json            # SINGLE SOURCE OF TRUTH for the catalog
│
├── i18n/
│   ├── en.json                  # English strings (default)
│   └── vi.json                  # Vietnamese strings
│
├── assets/
│   ├── css/styles.css           # Full design system (tokens, components)
│   ├── js/
│   │   ├── i18n.js              # Language engine (loads dicts, swaps text, localStorage)
│   │   ├── main.js              # Nav drawer, cart count, forms, cookie banner, reveals
│   │   ├── home.js              # Renders featured grid on the homepage
│   │   ├── shop.js              # Renders + filters the shop grid
│   │   └── product.js           # Renders product detail + SEO meta + JSON-LD
│   ├── img/                     # PLACEHOLDER SVGs — replace with real photos
│   └── docs/                    # PLACEHOLDER PDFs (line sheet, spec sheet)
│
├── blog/                        # (reserved for blog posts — see roadmap)
└── functions/                   # (optional serverless — NOT deployed on GitHub Pages)
```

---

## Quick start (local preview)

Because the JS uses `fetch()` to load JSON, you must serve the folder over HTTP (opening `index.html` via `file://` will fail CORS). Any static server works:

```bash
cd anlanho
python3 -m http.server 8000
# then open http://localhost:8000
```

Or with Node: `npx serve .`

The cart and forms run in **demo mode** until you add your real keys (see below). You'll still see "success" states so you can test the flow.

---

## Deploy to GitHub Pages

1. Create a new GitHub repository (e.g. `anlanho-site`).
2. Push the contents of this folder to the repo root:
   ```bash
   cd anlanho
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/<you>/anlanho-site.git
   git push -u origin main
   ```
3. In the repo: **Settings → Pages**.
4. Under **Build and deployment → Source**, choose **Deploy from a branch**.
5. Branch: **`main`**, folder: **`/ (root)`**. Save.
6. Wait ~1 minute; your site appears at `https://<you>.github.io/anlanho-site/`.

> The `.nojekyll` file is already included so GitHub Pages serves every file (including any starting with `_`) without running Jekyll.

---

## Custom domain + HTTPS

The repo already contains a **`CNAME`** file with `anlanho.com`.

1. At your DNS registrar, add records pointing to GitHub Pages:
   - **Apex domain `anlanho.com`** — four `A` records:
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
     (and optionally the matching `AAAA` records from GitHub's docs for IPv6).
   - **`www` subdomain** — one `CNAME` record → `<you>.github.io`.
2. In **Settings → Pages → Custom domain**, confirm `anlanho.com` is shown (it reads the `CNAME` file). Save.
3. Wait for the DNS check to pass, then tick **Enforce HTTPS**. GitHub provisions a free certificate automatically (can take up to ~24h on first setup).

> If you change the domain, edit `CNAME`, then update every absolute URL: the `https://anlanho.com/...` values in each page's canonical/`og:url`/hreflang tags, in `robots.txt`, and in `sitemap.xml`.

---

## Configure Snipcart (cart, checkout, payments)

Snipcart handles the cart UI, checkout, and payment collection (via Stripe) entirely client-side — you only expose a **public** key.

1. Create an account at snipcart.com and connect your payment gateway (Stripe).
2. Copy your **Public API Key** (Account → API Keys). It's safe in client code.
3. Replace every occurrence of `YOUR_SNIPCART_PUBLIC_API_KEY` with your key. It appears in:
   - `index.html`
   - `pages/shop.html`
   - `pages/product.html`
   - `pages/wholesale.html`
   ```bash
   # quick one-liner (macOS/Linux)
   grep -rl YOUR_SNIPCART_PUBLIC_API_KEY . | xargs sed -i '' 's/YOUR_SNIPCART_PUBLIC_API_KEY/YOUR_REAL_KEY/g'   # macOS
   # Linux: drop the '' after -i
   ```
4. **Shipping & tax:** in the Snipcart dashboard → **Shipping**, create rate(s). Products carry a `data-item-weight` (in grams, from `weight_g` in `products.json`) so you can use weight-based rules. Configure tax under **Taxes**.
5. **Go live:** Snipcart starts in **Test** mode. Test a full checkout with a Stripe test card, then flip to **Live** and use your live key.

### Important: product price validation
For security, Snipcart re-fetches each product's page to verify the price (`data-item-url` points to `pages/product.html?sku=…`). Because product pages render via JavaScript, Snipcart's crawler may not see the price in the raw HTML. Two options:

- **Easiest:** in Snipcart → **Account → Settings → enable "Allow products to be added without validation"** (fine while small / in test).
- **Most robust (recommended for live):** pre-render static price data into each product URL using the optional **`build.py`** script (see roadmap) so the crawler reads a real `data-item-price` from server-delivered HTML.

---

## Configure Formspree (newsletter + wholesale form)

Both forms POST to Formspree and degrade gracefully (honeypot anti-spam, AJAX success message, no page reload).

1. Create a form at formspree.io and copy its endpoint, e.g. `https://formspree.io/f/abcdwxyz`.
2. Replace `YOUR_FORM_ID` in:
   - `index.html` (newsletter, in the footer)
   - `pages/wholesale.html` (distributor inquiry)

   You can use one form for both or create separate forms (recommended, so wholesale leads are tagged separately).
3. **Until** a real ID is present, forms run in **demo mode**: the success message shows but nothing is sent. This lets you preview without wiring anything up.
4. **Optional hCaptcha:** enable it in Formspree and add their widget snippet inside the `<form>` if you want stronger spam protection beyond the built-in honeypot.

---

## Editing products

Everything about the catalog lives in **`data/products.json`**. Add or edit an entry and the shop, homepage featured grid, and product pages update automatically — no code changes.

Each product looks like this (fields shown abbreviated):

```jsonc
{
  "sku": "BTT-CLASSIC-150",       // unique; used in URLs (?sku=) and by Snipcart
  "name_en": "…", "name_vi": "…",
  "tagline_en": "…", "tagline_vi": "…",
  "description_en": "…", "description_vi": "…",
  "ingredients_en": "…", "ingredients_vi": "…",
  "allergens_en": "…", "allergens_vi": "…",
  "shelf_life_en": "…", "shelf_life_vi": "…",
  "size_en": "…", "size_vi": "…",
  "price": 12.0,                  // number, in USD
  "compare_at": 0,                // set > price to show a "sale" strike-through
  "weight_g": 150,                // used for Snipcart weight-based shipping
  "spice": 3,                     // 1–5, drives the chili meter
  "vegan": false, "halal": false,
  "stock": 24,                    // 0 = shows "Sold out" / notify
  "featured": true,               // appears in the homepage featured grid (max 4)
  "image_card": "../assets/img/product-classic-1.svg",
  "images": ["../assets/img/product-classic-1.svg", "…"]
}
```

Tips:
- **Currency** is set once at the top of the file (`"currency": "USD"`).
- Keep image paths relative with `../` because product/shop pages live in `/pages`.
- Reviews live in the `reviews` array (each tied to a `sku`); they power the star rating and `AggregateRating` schema on the product page.
- After adding products, **regenerate `sitemap.xml`** so the new `?sku=` URLs are listed (the bundled generator reads `products.json`).

---

## Editing translations

- `i18n/en.json` and `i18n/vi.json` hold every UI string as flat dotted keys (e.g. `nav.shop`, `wholesale.f.email`).
- In HTML, text is tagged with `data-i18n="some.key"`; attributes use `data-i18n-attr="placeholder:some.key"`.
- The two files must keep **identical keys**. To verify parity:
  ```bash
  python3 -c "import json;e=set(json.load(open('i18n/en.json')));v=set(json.load(open('i18n/vi.json')));print('only EN',e-v);print('only VI',v-e)"
  ```
- The chosen language is stored in `localStorage` (`aln_lang`) and can be forced via `?lang=vi`. English is the default and the `x-default` for hreflang.

---

## Analytics + Search Console

- **Google Analytics 4 / Tag Manager:** commented placeholders are already in `<head>` of `index.html`. Paste your GA4 Measurement ID (or GTM container) and copy the snippet into the other pages' `<head>`. The cookie banner dispatches a `consent:granted` event you can gate analytics on for GDPR-friendly loading.
- **Google Search Console:** verify the domain (DNS TXT record is easiest with a custom domain), then submit `https://anlanho.com/sitemap.xml`.
- **Bing Webmaster Tools:** you can import directly from Search Console.

---

## Replace placeholder images & PDFs

Everything in `assets/img/` and `assets/docs/` is a **placeholder**.

- **Product & hero photos:** replace the SVGs with real photography. Export **WebP** (with JPG fallback if you like), keep them reasonably sized (e.g. ≤ 1600px on the long edge), and update the paths in `data/products.json` if filenames change.
- **Social share image (`og-default.svg`):** SVG has poor support as an Open Graph image — **replace it with a real 1200×630 raster** (PNG/JPG) and update the `og:image`/`twitter:image` URLs across the pages.
- **Logo/favicon:** `logo-mark.svg` is fine as SVG; consider also adding a PNG favicon for older clients.
- **Wholesale PDFs:** `assets/docs/anlanho-wholesale-linesheet.pdf` and `anlanho-product-spec-sheet.pdf` are 1-page placeholders. Drop in your real documents using the same filenames (or update the links in `pages/wholesale.html`).

---

## Self-host fonts (recommended for production)

The pages currently load Fraunces + Be Vietnam Pro from Google Fonts with `preconnect` and `display=swap`. For the best Core Web Vitals (and to avoid a third-party request), self-host:

1. Download the WOFF2 files (e.g. via google-webfonts-helper).
2. Place them in `assets/fonts/` and add `@font-face` rules in `styles.css` with `font-display: swap`.
3. Remove the Google Fonts `<link>` tags and add `<link rel="preload" as="font" type="font/woff2" crossorigin>` for the 1–2 most critical weights.

---

## Optional serverless shipping function

GitHub Pages cannot run server code. If you ever need shipping logic beyond Snipcart's built-in rules (e.g. live carrier rates), put it in `functions/shipping.js` and deploy that **one function** to a serverless host:

- **Netlify Functions**, **Vercel Functions**, or **Cloudflare Workers** all work.
- Point Snipcart's **Shipping → Custom (webhook)** URL at the deployed function.
- Keep any secret keys in that host's environment variables — never in this repo.

The rest of the site stays on GitHub Pages; only the function lives elsewhere.

---

## SEO notes & the Snipcart crawler caveat

Implemented across the site:
- Unique `<title>` + meta description per page.
- `canonical`, plus `hreflang` `en` / `vi` / `x-default` alternates.
- Open Graph + Twitter card tags.
- JSON-LD: `Organization` + `WebSite` + `LocalBusiness` (home), `BreadcrumbList` (shop/wholesale/product), and `Product` with `AggregateRating`/`Review` injected by `product.js`.
- `robots.txt` + `sitemap.xml` (with hreflang).

**Caveat — JS-rendered content:** product and shop listings are rendered client-side from `products.json`. Modern Googlebot executes JS and will index them, but to be safe for *all* crawlers (and for Snipcart's price validator), consider pre-rendering static product/blog pages with the planned `build.py` script before a major launch.

---

## Accessibility & performance

- Mobile-first, fluid type, `prefers-reduced-motion` respected.
- Skip link, visible focus rings, `aria-*` on nav/cart/menu, semantic landmarks.
- Targets **WCAG AA** contrast and **Lighthouse ≥ 90**. After adding real (optimized) images and self-hosted fonts, you should comfortably clear 90 across the board.

---

## What's built vs. still to come

**Built and ready in this delivery:**
- Home (`index.html`)
- Shop (`pages/shop.html`)
- Product detail (`pages/product.html`)
- Wholesale / distributor (`pages/wholesale.html`)
- Full shared design system, i18n engine, catalog JSON, SEO config (`robots.txt`, `sitemap.xml`, `CNAME`, `.nojekyll`)

**Linked in the nav/footer and ready to add next (say the word and I'll build them):**
- About / Our Story
- Blog index + posts (with `Article`/`BlogPosting` schema) in `/blog`
- FAQ (with `FAQPage` schema)
- Contact (form + map embed)
- Legal: Privacy Policy, Terms of Service, Shipping & Returns, Cookie Notice
- Optional `functions/shipping.js` (serverless custom shipping)
- Optional `build.py` (pre-render static product/blog pages for maximum SEO + Snipcart validation)

Cart/checkout is service-handled by Snipcart (no separate cart page needed — it opens as a side panel anywhere on the site).

---

© TN Delicacy Distribution LLC · United States. Brand: **Ăn Là Nhớ**.
