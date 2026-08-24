const AI_CRAWLERS = [
  { name: "OAI-SearchBot", label: "OAI-SearchBot (ChatGPT search)" },
  { name: "ChatGPT-User", label: "ChatGPT-User (on-demand fetch)" },
  { name: "ClaudeBot", label: "ClaudeBot (Claude citations)" },
  { name: "PerplexityBot", label: "PerplexityBot" },
  { name: "Google-Extended", label: "Google-Extended (Gemini/AI features)" },
  { name: "Googlebot", label: "Googlebot (AI Overviews)" },
];

export interface CrawlerAccessResult {
  bots: { name: string; label: string; allowed: boolean }[];
  score: number; // 0-100
}

interface RobotsGroup {
  agents: string[];
  directives: { type: "allow" | "disallow"; path: string }[];
}

/**
 * Groups a robots.txt into records the way real crawlers do: one or more
 * consecutive `User-agent:` lines share the directives that follow them,
 * until the next `User-agent:` line starts a new record. A bot name can
 * legally appear in more than one group across the file (e.g. a platform's
 * auto-managed block followed by the site owner's own override block);
 * those groups get merged per-bot below, not treated as independent.
 */
function parseRobotsGroups(robotsTxt: string): RobotsGroup[] {
  const groups: RobotsGroup[] = [];
  let current: RobotsGroup | null = null;
  let collectingAgents = true;

  for (const rawLine of robotsTxt.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const agentMatch = line.match(/^user-agent:\s*(.*)$/i);
    if (agentMatch) {
      if (current && !collectingAgents) {
        groups.push(current);
        current = null;
      }
      if (!current) {
        current = { agents: [], directives: [] };
        collectingAgents = true;
      }
      current.agents.push(agentMatch[1].trim());
      continue;
    }

    if (!current) continue;
    collectingAgents = false;

    const disallowMatch = line.match(/^disallow:\s*(.*)$/i);
    const allowMatch = line.match(/^allow:\s*(.*)$/i);
    if (disallowMatch) {
      current.directives.push({ type: "disallow", path: disallowMatch[1].trim() });
    } else if (allowMatch) {
      current.directives.push({ type: "allow", path: allowMatch[1].trim() });
    }
    // Other directives (Sitemap, Content-Signal, Crawl-delay, etc.) are
    // intentionally ignored here: this check only answers "is the bot
    // blocked from the whole site", not the newer usage-permission signals.
  }
  if (current) groups.push(current);

  return groups;
}

/**
 * A bot is blocked from the whole site if the merged directives from every
 * group naming it (or, if none name it specifically, every wildcard `*`
 * group) contain a `Disallow: /` that isn't matched by an equally-specific
 * `Allow: /`; ties go to Allow, matching documented crawler behavior
 * (e.g. Google's robots.txt spec) where a later, equally-specific rule for
 * the same agent overrides an earlier one.
 */
function isBotBlocked(groups: RobotsGroup[], botName: string): boolean {
  const named = groups.filter((g) =>
    g.agents.some((a) => a.toLowerCase() === botName.toLowerCase()),
  );
  const applicable = named.length > 0 ? named : groups.filter((g) => g.agents.includes("*"));

  const directives = applicable.flatMap((g) => g.directives);
  const hasRootDisallow = directives.some((d) => d.type === "disallow" && d.path === "/");
  const hasRootAllow = directives.some((d) => d.type === "allow" && d.path === "/");

  return hasRootDisallow && !hasRootAllow;
}

export function checkCrawlerAccess(robotsTxt: string | null): CrawlerAccessResult {
  if (robotsTxt === null) {
    return {
      bots: AI_CRAWLERS.map((b) => ({ ...b, allowed: true })),
      score: 100,
    };
  }

  const groups = parseRobotsGroups(robotsTxt);
  const bots = AI_CRAWLERS.map((b) => ({
    ...b,
    allowed: !isBotBlocked(groups, b.name),
  }));
  const allowedCount = bots.filter((b) => b.allowed).length;
  const score = Math.round((allowedCount / bots.length) * 100);

  return { bots, score };
}
