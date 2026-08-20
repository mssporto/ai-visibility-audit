import { describe, expect, it } from "vitest";
import { checkCrawlerAccess } from "../crawler-access";

// Regression fixture: dahiana.work's real robots.txt as of 2026-08-20. It
// disallows several bots (including ClaudeBot and Google-Extended) in an
// auto-managed Cloudflare block, then explicitly re-allows them in a later,
// site-owner-authored block. The correct real-world answer is "allowed" —
// an earlier bug treated the first Disallow match as final and reported
// these as blocked.
const DAHIANA_WORK_ROBOTS_TXT = `
User-agent: *
Content-Signal: search=yes,ai-train=no,use=reference
Allow: /

User-agent: Amazonbot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: GPTBot
Disallow: /

User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Amazonbot
Allow: /

Sitemap: https://dahiana.work/sitemap-index.xml
`;

describe("checkCrawlerAccess", () => {
  it("no robots.txt at all means every bot is allowed", () => {
    const result = checkCrawlerAccess(null);
    expect(result.score).toBe(100);
    expect(result.bots.every((b) => b.allowed)).toBe(true);
  });

  it("a plain Disallow: / for a named bot blocks only that bot", () => {
    const robots = "User-agent: ClaudeBot\nDisallow: /\n";
    const result = checkCrawlerAccess(robots);
    const claude = result.bots.find((b) => b.name === "ClaudeBot")!;
    const perplexity = result.bots.find((b) => b.name === "PerplexityBot")!;
    expect(claude.allowed).toBe(false);
    expect(perplexity.allowed).toBe(true);
  });

  it("a later Allow: / for the same bot overrides an earlier Disallow: /", () => {
    const result = checkCrawlerAccess(DAHIANA_WORK_ROBOTS_TXT);
    const claude = result.bots.find((b) => b.name === "ClaudeBot")!;
    const googleExtended = result.bots.find((b) => b.name === "Google-Extended")!;
    expect(claude.allowed).toBe(true);
    expect(googleExtended.allowed).toBe(true);
  });

  it("an unnamed bot falls back to the wildcard group", () => {
    // OAI-SearchBot and Googlebot are never named in the fixture; they
    // should inherit the wildcard `*` group's Allow: /.
    const result = checkCrawlerAccess(DAHIANA_WORK_ROBOTS_TXT);
    const oaiSearch = result.bots.find((b) => b.name === "OAI-SearchBot")!;
    const googlebot = result.bots.find((b) => b.name === "Googlebot")!;
    expect(oaiSearch.allowed).toBe(true);
    expect(googlebot.allowed).toBe(true);
  });

  it("the full dahiana.work fixture allows all six tracked bots", () => {
    const result = checkCrawlerAccess(DAHIANA_WORK_ROBOTS_TXT);
    expect(result.score).toBe(100);
    expect(result.bots.every((b) => b.allowed)).toBe(true);
  });

  it("a wildcard-level block still blocks a bot with no specific override", () => {
    const robots = "User-agent: *\nDisallow: /\n";
    const result = checkCrawlerAccess(robots);
    expect(result.bots.every((b) => !b.allowed)).toBe(true);
  });
});
