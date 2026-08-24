/** A single citation shown in a category's "Sources" list. */
export interface CategoryLink {
  label: string;
  url: string;
}

/** The educational copy shown when a category row is expanded. */
export interface CategoryContent {
  label: string;
  what: string;
  why: string;
  links: CategoryLink[];
}

/**
 * One entry per scored category (see `score.ts`'s `AEO_WEIGHTS`/`GEO_WEIGHTS`
 * comment block for the weighting rationale: this file is the "why should a
 * visitor care" explanation, not the "why did we weight it this way" one).
 * Every link here is a real, load-bearing citation, not decoration, so
 * double-check a URL still resolves before changing or adding one.
 */
export const CATEGORY_CONTENT: Record<string, CategoryContent> = {
  crawlerAccess: {
    label: "Crawler Access",
    what: "Whether robots.txt lets AI crawlers (OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended, and Googlebot) actually fetch this page.",
    why: "If a crawler is blocked, nothing else on this page matters to it: it can never read the content at all. This is the single highest-weighted signal in both scores.",
    links: [
      {
        label: "Google: AI features & your site",
        url: "https://developers.google.com/search/docs/fundamentals/ai-optimization-guide",
      },
      {
        label: "Google: robots.txt introduction",
        url: "https://developers.google.com/search/docs/crawling-indexing/robots/intro",
      },
      { label: "OpenAI: GPTBot", url: "https://developers.openai.com/api/docs/bots" },
    ],
  },
  metaHygiene: {
    label: "Meta Hygiene",
    what: "The basics every search engine and AI system reads first: a page title, a meta description, a canonical URL, and exactly one H1.",
    why: "These fields are what most systems use to decide what a page is about before reading a word of the body content.",
    links: [
      {
        label: "Google: title links",
        url: "https://developers.google.com/search/docs/appearance/title-link",
      },
      {
        label: "Google: snippets & meta descriptions",
        url: "https://developers.google.com/search/docs/appearance/snippet",
      },
      {
        label: "Google: canonical URLs",
        url: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls",
      },
    ],
  },
  structuredData: {
    label: "Structured Data",
    what: "JSON-LD structured data: an Organization block, Article/BlogPosting markup, FAQPage question-and-answer markup, and sameAs links to other profiles of the same entity.",
    why: "Structured data states facts explicitly instead of implying them. Google says it isn't required for generative search, but recommends keeping it. FAQPage markup in particular maps directly onto how AI answer engines extract citable facts.",
    links: [
      {
        label: "Google: intro to structured data",
        url: "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data",
      },
      { label: "schema.org: Organization", url: "https://schema.org/Organization" },
      { label: "schema.org: FAQPage", url: "https://schema.org/FAQPage" },
    ],
  },
  contentQuality: {
    label: "Content Quality",
    what: "The structural patterns that make content easy to extract and quote: concrete numbers, quoted material, outbound citations, multiple subheadings, lists or tables, question-style headings, and a TL;DR near the top.",
    why: "AI answer engines favor content that's already broken into self-contained, quotable facts, the same structure that makes content easy for a person to skim.",
    links: [
      {
        label: "Google: AI features & your site",
        url: "https://developers.google.com/search/docs/fundamentals/ai-optimization-guide",
      },
      {
        label: "Google: creating helpful content",
        url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
      },
    ],
  },
  eeat: {
    label: "E-E-A-T Signals",
    what: "A visible author byline and a published or updated date, two of Google's stated Experience, Expertise, Authoritativeness, Trust (E-E-A-T) signals.",
    why: "Google explicitly uses E-E-A-T as a ranking-signal proxy, and dated, attributed content is easier for any system, human or AI, to trust and cite correctly.",
    links: [
      {
        label: "Google: E-E-A-T and quality rater guidelines",
        url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content",
      },
      {
        label: "Google: publication dates",
        url: "https://developers.google.com/search/docs/appearance/publication-dates",
      },
    ],
  },
  entityClarity: {
    label: "Entity Clarity",
    what: "Whether the page clearly identifies who or what it's about: a brand name in the title, a linked About section, and links to known-entity profiles like LinkedIn, Wikipedia, or Crunchbase.",
    why: "Not an official Google guideline: this weighting reflects industry-observed practice, not a documented Google factor. A clearly identified entity is still generally easier for any system to disambiguate correctly.",
    links: [
      { label: "schema.org: Organization", url: "https://schema.org/Organization" },
      {
        label: "Google: how Search organizes information",
        url: "https://www.google.com/search/howsearchworks/how-search-works/organizing-information/",
      },
    ],
  },
  sitemap: {
    label: "Sitemap",
    what: "Whether a working sitemap.xml exists, declared in robots.txt or found at a standard path.",
    why: "A standard crawlability and discoverability signal: Google's own AI-features guidance lists it alongside crawler access.",
    links: [
      {
        label: "Google: sitemaps overview",
        url: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview",
      },
      {
        label: "Google: AI features & your site",
        url: "https://developers.google.com/search/docs/fundamentals/ai-optimization-guide",
      },
    ],
  },
};

/**
 * Shown separately from the scored categories above, clearly marked as not
 * scored. Google's own position is explicit (quoted directly in `why`
 * below), so the UI has to be equally explicit that this isn't a hidden
 * eighth scoring category.
 */
export const LLMS_TXT_CONTENT: CategoryContent = {
  label: "llms.txt",
  what: "An llms.txt file at the site root, a proposed (not standardized) convention some AI tools use to find a curated summary of a site.",
  why: 'Not scored here, on purpose: Google states plainly that Search "ignores" llms.txt and that having one "will neither harm nor help your site\'s visibility." Shown anyway since it costs nothing to check, and other AI tools may still use it.',
  links: [
    {
      label: 'Google: AI features & your site (see "Mythbusting generative AI search")',
      url: "https://developers.google.com/search/docs/fundamentals/ai-optimization-guide",
    },
  ],
};

/**
 * Same "shown but not scored" treatment as llms.txt above, for the same
 * reason: it's a real signal, just not one this audit currently has grounds
 * to weight into either score.
 */
export const VIEWPORT_CONTENT: CategoryContent = {
  label: "Viewport meta tag",
  what: 'Whether the page declares a `<meta name="viewport">` tag, the basic signal a page is meant to adapt to different screen sizes.',
  why: "Not scored here: Google's AI-features guidance does list \"displays well across all devices\" as a real recommendation, but judging that properly needs actual rendering or performance measurement, not just a tag check, and this audit is a single stateless HTML fetch, not a rendering engine. Shown anyway since the tag itself costs nothing to check.",
  links: [
    {
      label: "Google: AI features & your site",
      url: "https://developers.google.com/search/docs/fundamentals/ai-optimization-guide",
    },
  ],
};

export const CONTENT_SIGNAL_CONTENT: CategoryContent = {
  label: "Content-Signal directive",
  what: 'Whether robots.txt declares a `Content-Signal` line (e.g. `Content-Signal: search=yes, ai-train=no`), a way to state separate permissions for search indexing, AI-model input, and AI training.',
  why: "Not scored here: this is a brand-new (2025) proposal from Cloudflare, not a Google-recognized robots.txt directive, and not confirmed to be honored by any major crawler yet. Shown for awareness since it costs nothing to check, and that may change.",
  links: [
    {
      label: "Cloudflare: Content Signals policy",
      url: "https://blog.cloudflare.com/content-signals-policy/",
    },
  ],
};
