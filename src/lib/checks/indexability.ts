import { findTags, parseAttributes } from "../html-attrs";

export interface IndexabilityResult {
  noindex: boolean;
  nosnippet: boolean;
}

/**
 * `<meta name="robots" content="noindex, nosnippet">` (or the Googlebot-
 * specific `name="googlebot"` variant) blocks the page from appearing in
 * Search at all (noindex) or from any snippet including AI features
 * (nosnippet) — confirmed directly by Google's own documentation:
 * https://developers.google.com/search/docs/appearance/featured-snippets
 * https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
 * ("AI features and your website" — indexing eligibility is the hard gate
 * for appearing in AI Overviews/AI Mode).
 *
 * This deliberately does NOT check the X-Robots-Tag HTTP header — that
 * requires access to the response object, not just the HTML body, and this
 * check operates on already-fetched HTML like every other check in
 * src/lib/checks/. A page using only the header form would be missed; this
 * is a known limitation, not something to silently paper over.
 */
export function checkIndexability(html: string): IndexabilityResult {
  const directives: string[] = [];
  for (const tag of findTags(html, "meta")) {
    const attrs = parseAttributes(tag);
    const name = attrs.name?.toLowerCase();
    if ((name === "robots" || name === "googlebot") && attrs.content) {
      directives.push(
        ...attrs.content
          .toLowerCase()
          .split(",")
          .map((d) => d.trim()),
      );
    }
  }

  return {
    noindex: directives.includes("noindex"),
    nosnippet: directives.includes("nosnippet"),
  };
}
