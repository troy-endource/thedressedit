# CLAUDE.md — thedressedit.co.uk
> Paste this file at the start of any new Claude chat to get full project context instantly.
> Keep this file updated as the project evolves.

---

## Project Overview

**Site:** thedressedit.co.uk — a UK dress style guide, editorially curated, powered by endource product data
**Stack:** Astro v4 + MDX + Decap CMS (editorial workflow) + Netlify
**Repo:** github.com/troy-endource/thedressedit (branch: `main`)
**DNS:** GoDaddy → Netlify
**Google Search Console:** Verified via HTML meta tag in BaseLayout

---

## Key Config

| Thing | Value |
|---|---|
| Cloudflare bypass header | `x-skip-end-header: 112dAWX8GIO` |
| Endource New In edit URL | `https://www.endource.com/edit/new-in-this-week/Wm9ZRcnnfAABTqZ8?categories%5B%5D=3` |
| CMS admin URL | `/admin/` (Decap CMS, Netlify Identity) |
| Netlify function URL | `/.netlify/functions/endource-product?url=<endource_url>` |
| Author name | Eleanor Marsh |
| Author role | Senior Style Editor |

---

## File Structure

```
thedressedit/
├── astro.config.mjs                  # Astro config — site URL, MDX integration
├── package.json                      # astro v4, @astrojs/mdx, node-fetch v2, cheerio
├── netlify/
│   └── functions/
│       └── endource-product.js       # Fetches + scrapes endource product/edit pages
├── public/
│   ├── admin/
│   │   ├── config.yml                # Decap CMS config — all collections and fields
│   │   ├── index.html                # CMS entry point
│   │   └── product-helper.html       # Helper tool for adding products
│   ├── images/uploads/               # CMS-managed media
│   └── new-in/
│       └── index.html                # Static New In page (live product data)
├── src/
│   ├── components/
│   │   ├── ProductGrid.astro         # Shoppable product grid (used in articles)
│   │   ├── StylistTip.astro          # Green callout tip box
│   │   └── EndourceCTA.astro         # Dark CTA banner linking to endource
│   ├── content/
│   │   ├── articles/                 # All article markdown files (8 articles)
│   │   └── settings/
│   │       ├── general.json          # Site title, announcement bar, newsletter
│   │       ├── homepage.json         # Hero + featured article slugs
│   │       ├── navigation.json       # Nav items
│   │       └── newin.json            # New In page hero image + edit URL
│   ├── layouts/
│   │   └── BaseLayout.astro          # Shared layout: nav, footer, newsletter, head slot
│   ├── pages/
│   │   ├── index.astro               # Homepage: hero, edit grid, carousel, text links
│   │   ├── [cluster].astro           # Dynamic cluster hub pages (e.g. /wedding-guest/)
│   │   └── articles/
│   │       └── [slug].astro          # Article template with inline products + tips
│   └── styles/
│       └── global.css                # Full design system — all styles
```

---

## Netlify Function: endource-product.js

Fetches endource pages with Cloudflare bypass header. Handles two modes:

- **Edit page** (`/edit/` or `/women/` or `/men/` in URL): extracts product URLs via JSON-LD ItemList or `<a href="/product/">` links, then fetches each product page in batches of 6
- **Product page**: extracts single product via JSON-LD Product schema, falls back to meta tags

Returns JSON with `type`, `products[]` (or `product`), `count`, `source`, `debug`.

**Response shape (edit page):**
```json
{
  "type": "edit",
  "title": "...",
  "products": [{ "name", "brand", "price", "currency", "image", "url", "retailer", "description" }],
  "count": 12,
  "source": "...",
  "debug": { "htmlLength", "jsonLdCount", "isEditPage", "timestamp" }
}
```

---

## Article Template: [slug].astro

Key features:
- Splits article HTML at H2 boundaries
- Inserts `<ProductGrid>` and `<StylistTip>` components inline after matching H2 headings (matched via `insertAfter` frontmatter field)
- `<EndourceCTA>` banner injected at the midpoint of product sections
- Reading progress bar
- Table of contents (auto-generated from H2s)
- Open Graph tags via `<Fragment slot="head">` for Google Discover
- Author bio + affiliate disclosure at bottom
- Related articles grid

---

## Article Frontmatter Schema

```yaml
title: string                    # Page H1
seoTitle: string                 # <title> tag override (max 70 chars)
description: string              # Meta description (max 160 chars)
subtitle: string                 # Italic standfirst below H1
cluster: string                  # See clusters below
publishDate: YYYY-MM-DD
updatedDate: YYYY-MM-DD          # Optional — set when refreshing content
author: Eleanor Marsh
authorRole: Senior Style Editor
readTime: number                 # Minutes
priority: HIGH | MEDIUM | LOW
featured: boolean                # Shows on homepage hero/grid
heroImage: string                # URL or /images/uploads/ path (1600x900 recommended)
heroImageAlt: string
heroImageCredit: string          # Optional
thumbnail: string                # 800x600, used in article cards
endourceLink: string             # Primary endource edit URL for this article
endourceCta: string              # CTA button text
productSections:                 # Array — see below
stylistTips:                     # Array — see below
relatedArticles:                 # Array — see below
```

**productSections item:**
```yaml
- sectionTitle: string           # Shown above product grid
  insertAfter: string            # Must match H2 heading text exactly
  sectionEndourceLink: string    # "Shop all" link for this section
  products:
    - brand, name, price, retailer, image, url, badge
```

**stylistTips item:**
```yaml
- title: string                  # Defaults to "Stylist's Tip"
  text: string
  insertAfter: string            # Must match H2 heading text exactly
```

**relatedArticles item:**
```yaml
- title: string
  cluster: string
  url: string                    # e.g. /articles/wedding-guest-dresses-2026/
```

---

## Content Clusters

| Slug | Display Name | Hub URL |
|---|---|---|
| `wedding-guest` | Wedding Guest Dresses | `/wedding-guest/` |
| `summer-dresses` | Summer Dresses | `/summer-dresses/` |
| `work-dresses` | Work Dresses | `/work-dresses/` |
| `trends-2026` | Dress Trends 2026 | `/trends-2026/` |
| `body-shape` | Dresses by Body Shape | `/body-shape/` |
| `occasions` | Occasion Dresses | `/occasions/` |
| `budget-sales` | Budget & Sales | `/budget-sales/` |
| `fabric-care` | Fabric & Care | `/fabric-care/` |

---

## Current Articles (src/content/articles/)

| File | Title | Cluster | Featured | Status |
|---|---|---|---|---|
| `minimal-wedding-guest-dresses-uk.md` | Best Minimal Wedding Guest Dresses 2026 | wedding-guest | ✅ | Live, has endourceLink + hero |
| `wedding-guest-dresses-2026.md` | Wedding Guest Dresses 2026: What to Wear | wedding-guest | ✅ | Live |
| `affordable-wedding-guest-dresses-uk.md` | Under £100: Best Affordable Wedding Guest Dresses | wedding-guest | ❌ | Live |
| `summer-wedding-guest-dresses-2026.md` | Summer Wedding Guest Dresses 2026 | wedding-guest | ❌ | Live |
| `dress-trends-2026.md` | 8 Dress Trends Dominating 2026 | trends-2026 | ❌ | Live |
| `best-midi-dresses-work-uk-2026.md` | Best Midi Dresses for Work UK 2026 | work-dresses | ❌ | Live |
| `dress-shape-body-type-guide.md` | What Dress Shape Suits My Body Type? | body-shape | ❌ | Live |
| `uk-dress-sales-calendar-2026.md` | UK Dress Sales Calendar 2026 | budget-sales | ❌ | Live |

**Note:** Two articles have `featured: true` — the template picks the first one found. Consider only having one featured at a time.

---

## Design System (global.css)

**Fonts:**
- Headings/body: `EB Garamond` (serif)
- UI/labels/nav: `DM Sans` (sans)

**CSS Variables:**
```css
--black: #1a1a1a
--white: #ffffff
--light-grey: #f5f4f2
--mid-grey: #e8e6e1
--text-light: #888
--serif: 'EB Garamond', serif
--sans: 'DM Sans', sans-serif
```

**Key classes:** `.hero-block`, `.edit-grid`, `.edit-card`, `.newin-carousel`, `.newin-card`, `.article-hero`, `.article-body`, `.toc-wrap`, `.product-section`, `.product-grid`, `.product-card`, `.tip-box`, `.endource-cta-block`, `.hub-hero`, `.hub-featured`, `.hub-grid`, `.hub-card`, `.announce-bar`, `.newsletter`

---

## Homepage (index.astro)

1. **Hero block** — featured article (frontmatter `featured: true`)
2. **Latest from the Edit** — 4-article grid (edit cards with numbered thumbnails)
3. **New In This Week** — product carousel fetching live from endource via Netlify function
4. **Text links section** — "The Dress Guide" with 4 key article links
5. **More from the Edit** — 3-article grid

Carousel uses `<script is:inline>` (required for Astro client-side JS). Skeletons show while loading.

---

## New In Page (public/new-in/index.html)

Static HTML page with its own product fetching logic. Hero image managed via Decap CMS (`src/content/settings/newin.json`). This was previously broken due to newin.json path — now resolved.

---

## Google Discover Optimisation

- `max-image-preview:large` in BaseLayout
- `<slot name="head" />` for per-page OG tags
- All articles have: `og:title`, `og:description`, `og:type`, `og:url`, `og:image`, `article:published_time`, `article:author`, `article:section`
- Search Console verified

---

## To Do

- ⬜ Add `@astrojs/sitemap` and submit sitemap to Search Console
- ⬜ Add product images to all 8 articles via Decap CMS
- ⬜ Set `insertAfter` fields on remaining 7 articles (only minimal-wedding-guest has endourceLink set)
- ⬜ Only one article should have `featured: true` at a time
- ⬜ Host hero images on own domain (currently mixing endource CDN + net-a-porter URLs)
- ⬜ Search functionality (articles + endource products)
- ⬜ Consistent publishing cadence
- ⬜ Related articles — most articles have empty `relatedArticles` arrays
- ⬜ Footer links are hardcoded — should pull from navigation.json
- ⬜ Newsletter form not connected to any service yet

---

## Tone of Voice (endource brand)

Writing for this site follows the endource Tone of Voice guidelines (Jan 2026):
- **Is:** calm, considered, articulate, joyful, warm, intelligent, unpretentious, quietly confident
- **Is not:** preachy, snobby, hyperbolic, trend-obsessed, patronising, overfamiliar
- **Preferred words:** aesthetic, capsule, considered, curated, edit, effortless, elevated, investment, longevity, pieces, refined, timeless, wardrobe
- **Avoid:** must-have, iconic, obsessed, stunning, on trend, slay, era, haul, drop, chic, flattering
- **CTAs:** Explore, Discover, Browse, See the edit, Shop the edit, Find yours
- **British English** throughout, plain language, no hyperbole, contractions are fine

---

*Last updated: March 2026 — generated from repo ZIP by Claude*
