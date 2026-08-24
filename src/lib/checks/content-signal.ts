export interface ContentSignalResult {
  found: boolean;
  raw: string | null;
}

/**
 * Informational only (not scored): `Content-Signal` is a brand-new (2025)
 * proposal from Cloudflare, not a Google-recognized robots.txt directive and
 * not confirmed to be honored by any major crawler yet:
 * https://blog.cloudflare.com/content-signals-policy/
 * Example line: `Content-Signal: search=yes, ai-train=no`. Shown for
 * awareness the same way llms.txt is, since it costs nothing to check and
 * adoption may change. Unlike `Allow`/`Disallow`, this doesn't need
 * per-user-agent group resolution: it's a simple presence-and-value check,
 * not something this audit uses to decide whether a page is blocked.
 */
export function checkContentSignal(robotsTxt: string | null): ContentSignalResult {
  if (!robotsTxt) return { found: false, raw: null };
  const match = robotsTxt.match(/^content-signal:\s*(.+)$/im);
  if (!match) return { found: false, raw: null };
  return { found: true, raw: match[1].trim() };
}
