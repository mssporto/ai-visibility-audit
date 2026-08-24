export interface EeatResult {
  hasAuthor: boolean;
  hasPublishDate: boolean;
  hasOutboundCitations: boolean;
  score: number; // 0-100
}

/**
 * Google's own recommended way to expose a byline date is JSON-LD
 * `datePublished`/`dateModified` on an Article/BlogPosting/CreativeWork,
 * not just a visible <time> tag or article:published_time meta tag:
 * https://developers.google.com/search/docs/appearance/publication-dates
 * A <time>-only check misses this entirely (confirmed live: dahiana.work's
 * JSON-LD has a real `dateModified` field that a <time>-only check never
 * saw).
 */
function hasJsonLdDateField(html: string): boolean {
  const blocks = [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];
  for (const block of blocks) {
    try {
      if (containsDateField(JSON.parse(block[1]))) return true;
    } catch {
      // Malformed JSON-LD block: skip it, don't crash the audit.
    }
  }
  return false;
}

function containsDateField(node: unknown): boolean {
  if (Array.isArray(node)) return node.some(containsDateField);
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (typeof obj["datePublished"] === "string") return true;
    if (typeof obj["dateModified"] === "string") return true;
    if (Array.isArray(obj["@graph"])) return containsDateField(obj["@graph"]);
  }
  return false;
}

export function checkEeat(html: string, siteOrigin: string): EeatResult {
  const hasAuthor =
    /<meta[^>]+name=["']author["']/i.test(html) ||
    /class=["'][^"']*\bauthor\b[^"']*["']/i.test(html) ||
    /rel=["']author["']/i.test(html);

  const hasPublishDate =
    /<time[^>]/i.test(html) ||
    /property=["']article:published_time["']/i.test(html) ||
    /property=["']article:modified_time["']/i.test(html) ||
    /<meta[^>]+name=["']date["']/i.test(html) ||
    hasJsonLdDateField(html);

  const hasOutboundCitations = [...html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)]
    .map((m) => m[1])
    .some((href) => /^https?:\/\//i.test(href) && !href.includes(siteOrigin));

  let score = 0;
  if (hasAuthor) score += 40;
  if (hasPublishDate) score += 40;
  if (hasOutboundCitations) score += 20;

  return { hasAuthor, hasPublishDate, hasOutboundCitations, score };
}
