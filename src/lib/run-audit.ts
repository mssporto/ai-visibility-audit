import { isBlockedFetchTarget } from "./ssrf-guard";
import { buildAuditReport, type AuditReport } from "./score";
import { SITE_URL } from "../consts.ts";

export class AuditError extends Error {}

const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT = `ai-visibility-audit/0.1 (+${SITE_URL})`;

async function safeFetch(url: string): Promise<Response> {
  if (isBlockedFetchTarget(url)) {
    throw new AuditError("This URL points at a disallowed address.");
  }

  const response = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { "User-Agent": USER_AGENT },
  });

  // Manually follow redirects (max 3 hops) so every hop gets re-validated
  // against the SSRF guard: a URL can pass the initial check and then
  // redirect to an internal address.
  let hops = 0;
  let current = response;
  let currentUrl = url;
  while (current.status >= 300 && current.status < 400 && hops < 3) {
    const location = current.headers.get("location");
    if (!location) break;
    currentUrl = new URL(location, currentUrl).toString();
    if (isBlockedFetchTarget(currentUrl)) {
      throw new AuditError("This URL redirects to a disallowed address.");
    }
    current = await fetch(currentUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": USER_AGENT },
    });
    hops += 1;
  }

  return current;
}

export async function runAudit(rawUrl: string): Promise<AuditReport> {
  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    throw new AuditError("That doesn't look like a valid URL.");
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    throw new AuditError("Only http/https URLs are supported.");
  }

  const pageResponse = await safeFetch(target.toString());
  if (!pageResponse.ok) {
    throw new AuditError(`Could not fetch that URL (HTTP ${pageResponse.status}).`);
  }
  const xRobotsTag = pageResponse.headers.get("x-robots-tag");
  const html = await pageResponse.text();

  const robotsUrl = new URL("/robots.txt", target.origin).toString();
  let robotsTxt: string | null = null;
  try {
    const robotsResponse = await safeFetch(robotsUrl);
    robotsTxt = robotsResponse.ok ? await robotsResponse.text() : null;
  } catch {
    robotsTxt = null; // robots.txt is optional; absence just means "nothing disallowed"
  }

  const hasSitemap = await checkSitemapPresence(target.origin, robotsTxt);
  const hasLlmsTxt = await checkLlmsTxtPresence(target.origin);

  return buildAuditReport(
    target.toString(),
    html,
    robotsTxt,
    target.origin,
    hasSitemap,
    hasLlmsTxt,
    xRobotsTag,
  );
}

/**
 * Informational only (not scored): Google explicitly ignores llms.txt, so
 * it neither helps nor hurts either score: "Google Search itself doesn't
 * use them... Doing so will neither harm nor help your site's visibility
 * or rankings in Google Search, as Google Search ignores them."
 * https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
 * ("Mythbusting generative AI search" section). Shown purely for
 * awareness, same as the Firecrawl reference tool does.
 */
async function checkLlmsTxtPresence(origin: string): Promise<boolean> {
  try {
    const response = await safeFetch(new URL("/llms.txt", origin).toString());
    return response.ok;
  } catch {
    return false;
  }
}

// A `Sitemap:` line in robots.txt is the most reliable source; the common
// default filenames are a fallback for sites that omit it.
async function checkSitemapPresence(origin: string, robotsTxt: string | null): Promise<boolean> {
  const declaredSitemap = robotsTxt?.match(/^sitemap:\s*(\S+)/im)?.[1];
  const candidates = declaredSitemap
    ? [declaredSitemap]
    : [
        new URL("/sitemap.xml", origin).toString(),
        new URL("/sitemap_index.xml", origin).toString(),
        new URL("/sitemap-index.xml", origin).toString(),
      ];

  for (const candidate of candidates) {
    try {
      const response = await safeFetch(candidate);
      if (response.ok) return true;
    } catch {}
  }
  return false;
}
