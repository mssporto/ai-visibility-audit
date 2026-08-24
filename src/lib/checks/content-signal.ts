export interface ContentSignalResult {
  found: boolean;
  raw: string | null;
}

/**
 * Informational only (not scored): `Content-Signal` is a brand-new (2025)
 * proposal from Cloudflare, not a Google-recognized robots.txt directive and
 * not confirmed to be honored by any major crawler yet:
 * https://blog.cloudflare.com/content-signals-policy/
 * A simple presence-and-value check, unlike the per-agent group resolution
 * `crawler-access.ts` needs for `Allow`/`Disallow`.
 */
export function checkContentSignal(robotsTxt: string | null): ContentSignalResult {
  if (!robotsTxt) return { found: false, raw: null };
  const match = robotsTxt.match(/^content-signal:\s*(.+)$/im);
  if (!match) return { found: false, raw: null };
  return { found: true, raw: match[1].trim() };
}
