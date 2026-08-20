// Organization's direct schema.org subtypes — a page typed as Corporation,
// LocalBusiness, etc. is still legitimately expressing organization-level
// entity data and should count for the same signal. Source (subtype list
// as of this writing): https://schema.org/Organization ("More specific
// Types" section). This is the type hierarchy's first level only — deeper
// subtypes (e.g. LocalBusiness's own children like Restaurant or Store)
// aren't enumerated here; a known, documented gap, not an oversight.
const ORGANIZATION_SUBTYPES = new Set([
  "Organization",
  "Airline",
  "Consortium",
  "Cooperative",
  "Corporation",
  "EducationalOrganization",
  "FundingScheme",
  "GovernmentOrganization",
  "LibrarySystem",
  "LocalBusiness",
  "MedicalOrganization",
  "NGO",
  "NewsMediaOrganization",
  "OnlineBusiness",
  "PerformingGroup",
  "PoliticalParty",
  "Project",
  "ResearchOrganization",
  "SearchRescueOrganization",
  "SportsOrganization",
  "WorkersUnion",
]);

export interface StructuredDataResult {
  typesFound: string[];
  hasOrganization: boolean;
  hasArticle: boolean;
  hasFaqPage: boolean;
  hasSameAs: boolean;
  score: number; // 0-100
}

function collectTypes(node: unknown, out: Set<string>): void {
  if (Array.isArray(node)) {
    for (const item of node) collectTypes(item, out);
    return;
  }
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    if (typeof obj["@type"] === "string") out.add(obj["@type"]);
    if (Array.isArray(obj["@type"])) {
      for (const t of obj["@type"]) if (typeof t === "string") out.add(t);
    }
    if (obj["sameAs"]) out.add("__hasSameAs");
    if (Array.isArray(obj["@graph"])) collectTypes(obj["@graph"], out);
  }
}

export function checkStructuredData(html: string): StructuredDataResult {
  const blocks = [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];

  const types = new Set<string>();
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1]);
      collectTypes(parsed, types);
    } catch {
      // Malformed JSON-LD block — skip it, don't crash the audit.
    }
  }

  const hasSameAs = types.has("__hasSameAs");
  types.delete("__hasSameAs");
  const typesFound = [...types];

  const hasOrganization = [...types].some((t) => ORGANIZATION_SUBTYPES.has(t));
  const hasArticle = types.has("Article") || types.has("BlogPosting");
  const hasFaqPage = types.has("FAQPage");

  let score = 0;
  if (typesFound.length > 0) score += 25;
  if (hasOrganization) score += 25;
  if (hasArticle) score += 15;
  if (hasFaqPage) score += 25;
  if (hasSameAs) score += 10;

  return { typesFound, hasOrganization, hasArticle, hasFaqPage, hasSameAs, score };
}
