import { checkCrawlerAccess } from "./checks/crawler-access";
import { checkContentQuality } from "./checks/content-quality";
import { checkEeat } from "./checks/eeat";
import { checkEntityClarity } from "./checks/entity-clarity";
import { checkIndexability } from "./checks/indexability";
import { checkMetaHygiene } from "./checks/meta-hygiene";
import { checkStructuredData } from "./checks/structured-data";

export interface Recommendation {
  priority: "P0" | "P1";
  title: string;
  detail: string;
}

export interface AuditReport {
  url: string;
  aeoScore: number;
  geoScore: number;
  hasSitemap: boolean; // informational only — not counted in either score
  hasLlmsTxt: boolean; // informational only — Google explicitly ignores llms.txt
  blockedFromIndexing: boolean; // noindex present — both scores are forced to 0 below
  blockedFromSnippets: boolean; // nosnippet present — page can't appear in any snippet
  categories: {
    crawlerAccess: ReturnType<typeof checkCrawlerAccess>;
    metaHygiene: ReturnType<typeof checkMetaHygiene>;
    structuredData: ReturnType<typeof checkStructuredData>;
    contentQuality: ReturnType<typeof checkContentQuality>;
    eeat: ReturnType<typeof checkEeat>;
    entityClarity: ReturnType<typeof checkEntityClarity>;
  };
  recommendations: Recommendation[];
}

// Weights per score, out of 100. AEO leans on hygiene/crawler-access/E-E-A-T
// (traditional-search-adjacent factors); GEO leans on content answerability
// and entity clarity (what a generative engine needs to synthesize/cite you).
//
// Sources backing these specific choices:
// - Crawler access weighted heaviest in both: "ensure your content is
//   crawlable, as Google Search generative AI models use publicly
//   accessible, crawlable content" — Google's official generative-AI-search
//   guidance: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
// - Sitemap scored (not just informational) for the same reason — it's
//   part of "follow crawling best practices" in the same guidance, tied to
//   meeting the "Search technical requirements" required for AI-feature
//   eligibility. Weighted higher in AEO than GEO because the evidence for
//   it is Google-specific; no equivalent official statement exists for
//   third-party generative engines.
// - llms.txt deliberately excluded from both: "Google Search itself
//   doesn't use them... neither helps nor harms your site's visibility" —
//   same guidance, "Mythbusting generative AI search" section.
// - Structured data weighted moderately, not heavily, in both: "Structured
//   data isn't required for generative AI search... However, it's a good
//   idea to continue using it as part of your overall SEO strategy" — same
//   guidance.
// - E-E-A-T counted only in AEO (it's a Google ranking-signal proxy, not a
//   documented factor for third-party generative engines); entity clarity
//   counted only in GEO, per the Firecrawl reference tool's own stated
//   rationale ("more influential for third-party GEO engines than for
//   Google") — an idea borrowed from that tool, not an official source.
// - Content quality weighted heavier in GEO than AEO, per the Princeton GEO
//   study (arXiv:2311.09735) as cited by the Firecrawl reference tool —
//   we haven't independently verified that study ourselves.
const AEO_WEIGHTS = {
  crawlerAccess: 25,
  metaHygiene: 15,
  structuredData: 20,
  contentQuality: 10,
  eeat: 15,
  sitemap: 15,
};

const GEO_WEIGHTS = {
  crawlerAccess: 18,
  contentQuality: 27,
  entityClarity: 22,
  structuredData: 15,
  metaHygiene: 10,
  sitemap: 8,
};

function weightedTotal(weights: Record<string, number>, scores: Record<string, number>): number {
  let total = 0;
  for (const [key, weight] of Object.entries(weights)) {
    total += (scores[key] / 100) * weight;
  }
  return Math.round(total);
}

function buildRecommendations(
  categories: AuditReport["categories"],
  hasSitemap: boolean,
  indexability: ReturnType<typeof checkIndexability>,
): Recommendation[] {
  const recs: Recommendation[] = [];

  if (indexability.noindex) {
    recs.push({
      priority: "P0",
      title: "noindex is blocking this page entirely",
      detail:
        "This page has <meta name=\"robots\" content=\"noindex\">, which excludes it from Google Search and AI features altogether — nothing else on this page matters until this is removed.",
    });
  }
  if (indexability.nosnippet) {
    recs.push({
      priority: "P0",
      title: "nosnippet is blocking any snippet",
      detail:
        "This page has a nosnippet directive, which prevents any snippet — including AI Overviews/AI Mode — from showing this page's content.",
    });
  }
  if (!categories.eeat.hasAuthor) {
    recs.push({
      priority: "P0",
      title: "Author attribution",
      detail: "Add a visible author byline and a meta author tag.",
    });
  }
  if (!categories.eeat.hasPublishDate) {
    recs.push({
      priority: "P0",
      title: "Publish / update date",
      detail: "Expose published/modified dates via <time> or article:published_time.",
    });
  }
  if (!categories.structuredData.hasFaqPage) {
    recs.push({
      priority: "P1",
      title: "FAQPage structured data",
      detail: "Add FAQPage JSON-LD for question/answer content — highly citable by AI.",
    });
  }
  if (!categories.structuredData.hasOrganization) {
    recs.push({
      priority: "P1",
      title: "Organization structured data",
      detail: "Add an Organization JSON-LD block with name, url, and logo.",
    });
  }
  if (!categories.contentQuality.hasBlockquote) {
    recs.push({
      priority: "P1",
      title: "Blockquotes or quoted text",
      detail: "Add quotable, self-contained statements or expert quotes.",
    });
  }
  if (!categories.contentQuality.hasQuestionHeading) {
    recs.push({
      priority: "P1",
      title: "Question-style heading",
      detail: "Add question-style headings that mirror how users prompt AI.",
    });
  }
  if (!categories.contentQuality.hasTldrHeading) {
    recs.push({
      priority: "P1",
      title: "TL;DR / summary heading near top",
      detail: "Add an answer-first TL;DR or Key Takeaways section near the top.",
    });
  }
  if (!categories.entityClarity.hasAboutPage) {
    recs.push({
      priority: "P1",
      title: "About page",
      detail: "Add a linked About page describing the entity authoritatively.",
    });
  }
  const blockedBots = categories.crawlerAccess.bots.filter((b) => !b.allowed);
  for (const bot of blockedBots) {
    recs.push({
      priority: "P0",
      title: `${bot.label} is blocked`,
      detail: `robots.txt disallows ${bot.name} — this AI crawler cannot access the page at all.`,
    });
  }
  if (!hasSitemap) {
    recs.push({
      priority: "P1",
      title: "sitemap.xml",
      detail:
        "Add a working sitemap.xml (and declare it in robots.txt) — a standard crawlability/discoverability signal per Google's generative-AI-search guidance.",
    });
  }

  return recs;
}

export function buildAuditReport(
  url: string,
  html: string,
  robotsTxt: string | null,
  siteOrigin: string,
  hasSitemap: boolean,
  hasLlmsTxt: boolean,
): AuditReport {
  const categories = {
    crawlerAccess: checkCrawlerAccess(robotsTxt),
    metaHygiene: checkMetaHygiene(html),
    structuredData: checkStructuredData(html),
    contentQuality: checkContentQuality(html, siteOrigin),
    eeat: checkEeat(html, siteOrigin),
    entityClarity: checkEntityClarity(html),
  };
  const indexability = checkIndexability(html);

  const scores = {
    crawlerAccess: categories.crawlerAccess.score,
    metaHygiene: categories.metaHygiene.score,
    structuredData: categories.structuredData.score,
    contentQuality: categories.contentQuality.score,
    eeat: categories.eeat.score,
    entityClarity: categories.entityClarity.score,
    sitemap: hasSitemap ? 100 : 0,
  };

  // A noindex directive excludes the page from Search (and therefore AI
  // features) entirely, regardless of how well every other check scores —
  // confirmed by Google's own documentation (see checkIndexability's
  // comment). Reporting a non-zero score for a page Google won't show at
  // all would be actively misleading, not just incomplete.
  const aeoScore = indexability.noindex ? 0 : weightedTotal(AEO_WEIGHTS, scores);
  const geoScore = indexability.noindex ? 0 : weightedTotal(GEO_WEIGHTS, scores);

  return {
    url,
    aeoScore,
    geoScore,
    hasSitemap,
    hasLlmsTxt,
    blockedFromIndexing: indexability.noindex,
    blockedFromSnippets: indexability.nosnippet,
    categories,
    recommendations: buildRecommendations(categories, hasSitemap, indexability),
  };
}
