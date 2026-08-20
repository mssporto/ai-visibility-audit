# SEO/AEO Audit Brief — reusable prompt

Paste this to a fresh agent (filling in the bracketed target) to repeat the audit done on
campingjacobotayrona.com against a different page or site.

---

I need to audit what SEO and AEO (answer-engine-optimization — structured data for LLM/AI
crawlers) elements are present or missing on **[TARGET: file path(s) / URL(s) / project dir]**.

Please check and report back, per page:

1. Does the `<head>` contain: `<title>`, `<meta name="description">`,
   `<link rel="canonical">`, `<meta name="viewport">`? Quote what exists, note what's missing.
2. If the site is multilingual: are there `<link rel="alternate" hreflang="...">` tags
   cross-linking the language variants, including `x-default`?
3. Open Graph tags: `og:title`, `og:description`, `og:image` (is it an **absolute** URL —
   relative paths break link previews), `og:url`, `og:type`, `og:site_name`, `og:locale`.
4. Twitter Card tags: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`.
5. JSON-LD structured data (`<script type="application/ld+json">`) — search the whole repo/site
   for `ld+json`. If present, what `@type` and properties? If absent, what `@type` would fit
   this business/content (e.g. `LodgingBusiness`, `Campground`, `LocalBusiness`, `Article`,
   `Product`, `FAQPage`)?
6. Favicon `<link rel="icon">` and a web app manifest (`manifest.json` / `*.webmanifest`) —
   present or missing (manifest is low-priority, PWA-only, not an SEO factor).
7. `robots.txt` and `sitemap.xml` at the site root — present or missing, and does robots.txt
   point to the sitemap?
8. Images in main content — any missing `alt` text?
9. If pages load shared partials (navbar/footer) via client-side JS `fetch()`, note that their
   contents are invisible to crawlers that don't execute JS — flag anything SEO-relevant stuck
   inside those partials.

Report concisely, structured per page, under 500 words. Just the facts about current state —
no recommendations yet.

---

## Fix pattern used last time (campingjacobotayrona.com)

Once the audit is back, the fixes that were applied (adapt paths/values per project):

- **`robots.txt`** at repo root: `User-agent: *` / `Allow: /` / `Sitemap: <absolute-sitemap-url>`
- **`sitemap.xml`** at repo root: `<urlset>` with one `<url>` per page, `<xhtml:link rel="alternate"
  hreflang="...">` for each language variant of that page
- **Per-page `<head>` additions** (inserted right after the existing meta description):
  - `<link rel="canonical" href="...">` — self-referencing, absolute URL
  - `<link rel="alternate" hreflang="LANG" href="...">` for each language + `hreflang="x-default"`
    pointing at the primary-market language
  - `<meta property="og:type" content="website">`, `og:site_name`, `og:title`, `og:description`
    (mirrors the page's own title/description), `og:url` (= canonical), `og:image` (made
    **absolute**, since relative paths silently break OG previews), `og:locale` +
    `og:locale:alternate`
  - `<meta name="twitter:card" content="summary_large_image">` + `twitter:title`,
    `twitter:description`, `twitter:image`
- **JSON-LD block** before `</head>`, one shared `@id` (e.g.
  `https://domain.com/#business`) reused across every page of that entity, `@type` matched to
  the business (was `Campground` here), with `name`, `description` (page-specific), `url`
  (homepage), `image`, `telephone`, `email`, `priceRange`, `foundingDate` if applicable,
  `address` (`PostalAddress`), `geo` (`GeoCoordinates`), `sameAs` (social profile URLs)
- **Root/redirect pages** (client-side JS language redirects, thin landing pages): give them
  their own title/description/canonical/hreflang too, plus a `<noscript><meta http-equiv=
  "refresh"...></noscript>` fallback and a visible fallback link, since crawlers that skip JS
  execution otherwise see an empty page

## Process notes

- Read a couple of representative pages in full first to learn exact existing title/description
  text and confirm the `<head>` structure is consistent across pages before batch-editing.
- Use `grep`/`sed -n` across all pages to confirm line-level consistency (e.g. same anchor line
  to edit) before writing per-file `Edit` calls — much faster than reading every file in full.
- Validate every JSON-LD block parses (`python3 -c "import json; json.loads(...)"`) before
  committing.
- TaskCreate one task per page when the fix spans many files — keeps a long mechanical edit
  session auditable and resumable.
