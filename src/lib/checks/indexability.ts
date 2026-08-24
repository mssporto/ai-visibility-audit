import { findTags, parseAttributes } from "../html-attrs";

export interface IndexabilityResult {
  noindex: boolean;
  nosnippet: boolean;
}

/**
 * `<meta name="robots" content="noindex, nosnippet">` (or the Googlebot-
 * specific `name="googlebot"` variant), or the equivalent `X-Robots-Tag`
 * HTTP response header, blocks the page from appearing in Search at all
 * (noindex) or from any snippet including AI features (nosnippet): confirmed
 * directly by Google's own documentation:
 * https://developers.google.com/search/docs/appearance/featured-snippets
 * https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
 * ("AI features and your website": indexing eligibility is the hard gate
 * for appearing in AI Overviews/AI Mode).
 *
 * Both forms are treated as equally blocking on purpose: a page relying
 * only on the header form has the exact same real-world effect as one using
 * the meta tag, so showing the header form as a separate "informational,
 * doesn't affect the score" signal (the way llms.txt or Content-Signal are
 * shown) would misrepresent what it actually does.
 */
export function checkIndexability(html: string, xRobotsTag: string | null): IndexabilityResult {
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
  if (xRobotsTag) {
    // May be prefixed with a specific agent, e.g. "googlebot: noindex" rather
    // than a bare "noindex, nofollow": strip that prefix before splitting so
    // it doesn't get read as a single, non-matching directive.
    const cleaned = xRobotsTag.replace(/^[a-z0-9_-]+:\s*/i, "");
    directives.push(
      ...cleaned
        .toLowerCase()
        .split(",")
        .map((d) => d.trim()),
    );
  }

  return {
    noindex: directives.includes("noindex"),
    nosnippet: directives.includes("nosnippet"),
  };
}
