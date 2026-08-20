import { decodeEntities } from "../html-attrs";

export interface EntityClarityResult {
  brandInTitle: boolean;
  hasAboutPage: boolean;
  hasKnownEntityLinks: boolean;
  score: number; // 0-100
}

const KNOWN_ENTITY_HOSTS = [
  "linkedin.com",
  "twitter.com",
  "x.com",
  "github.com",
  "instagram.com",
  "facebook.com",
  "youtube.com",
  "crunchbase.com",
  "wikipedia.org",
];

export function checkEntityClarity(html: string): EntityClarityResult {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1].trim()) : "";
  // Heuristic: a title with more than one word likely includes a brand/site name,
  // rather than being a single generic word. Real brand-matching would need a
  // known brand name as input, which this stateless single-fetch audit doesn't have.
  const brandInTitle = title.split(/\s+/).length > 1;

  // A separate /about page, OR an in-page anchor section (#about, #about-us)
  // — single-page sites commonly use the latter and shouldn't be penalized
  // for it just because they don't have a dedicated URL.
  const hasAboutPage =
    /href=["'][^"']*\/about[^"']*["']/i.test(html) ||
    /href=["']#about[-]?(us)?["']/i.test(html) ||
    /\bid=["']about[-]?(us)?["']/i.test(html);

  const links = [...html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)].map((m) => m[1]);
  const hasKnownEntityLinks = links.some((href) =>
    KNOWN_ENTITY_HOSTS.some((host) => href.includes(host)),
  );

  let score = 0;
  if (brandInTitle) score += 34;
  if (hasAboutPage) score += 33;
  if (hasKnownEntityLinks) score += 33;

  return { brandInTitle, hasAboutPage, hasKnownEntityLinks, score: Math.min(score, 100) };
}
