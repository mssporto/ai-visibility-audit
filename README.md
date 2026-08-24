# AI Visibility Audit

A free, instant **AEO** (Answer Engine Optimization) and **GEO** (Generative Engine Optimization)
visibility audit. Paste a URL, get two scores out of 100 — one for readiness to appear in
existing answer-engine/search-adjacent AI features, one for readiness to be synthesized or cited
by generative engines — broken into scored categories with prioritized, sourced recommendations.

**Live**: [ai-audit.dahiana.work](https://ai-audit.dahiana.work)

## What this is (and isn't)

This is a personal portfolio project, not a commercial SEO product. It's fully stateless: every audit re-fetches the target page live, checks
it against a documented, cited checklist (AI crawler access, structured data, content answerability, E-E-A-T signals, entity clarity, meta hygiene, sitemap presence), and scores it. Nothing is stored, no email is collected, and there's no paywall.

**It measures structural readiness, not proof of AI visibility.** The scores are an opinionated
heuristic based on publicly documented guidance (Google's AI-optimization docs, schema.org, and
similar), not an industry standard, and they can't see your business context, competitors, or
goals the way a human expert can. Treat a report as a starting point, not a strategy — before
acting on it, consulting a qualified SEO/AEO/GEO professional is strongly recommended.

## How it works

1. You submit a URL from the homepage.
2. A Cloudflare Pages Function ([`functions/api/audit.ts`](functions/api/audit.ts)) fetches the
   page's HTML and `robots.txt` server-side, after passing an SSRF guard that blocks private,
   loopback, link-local, and cloud-metadata addresses (re-validated after redirects).
3. Each checklist rule ([`src/lib/checks/`](src/lib/checks)) runs against that HTML with targeted
   string/regex extraction (no full DOM parse, to stay inside Cloudflare's free-tier CPU budget).
4. Results are rolled up into weighted AEO/GEO scores ([`src/lib/score.ts`](src/lib/score.ts) —
   see the comment block above the weight tables for the cited source behind each weighting
   decision) and rendered as a scannable, keyboard-navigable breakdown.

## Tech stack

- [Astro](https://astro.build) (static output) on Cloudflare Pages
- A Cloudflare Pages Function for the audit endpoint — no other backend, no database
- [Vitest](https://vitest.dev) for the SSRF guard, checklist rules, and scoring engine
- [vanilla-cookieconsent](https://github.com/orestbida/cookieconsent) + GTM/Consent Mode v2 for
  analytics, opt-in by default

## Local development

```bash
npm ci
npm run dev        # http://localhost:4321
npm test           # vitest
npx astro check    # type check
npm run build      # production build to ./dist
```

The audit endpoint itself is a Cloudflare Pages Function and won't respond under plain
`astro dev`; test it locally with `npx wrangler pages dev dist` after a build.

## License

[MIT](LICENSE)

---

Built by [Dahiana](https://dahiana.work).
