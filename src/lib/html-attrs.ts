/**
 * Attribute order inside an HTML tag is not meaningful — `<meta content="x"
 * name="y">` and `<meta name="y" content="x">` are equally valid, and real
 * sites use both (webflow.com's homepage does the former). Parse each
 * attribute independently rather than assuming a fixed order between two
 * attributes.
 */
export function parseAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const match of tag.matchAll(/([a-zA-Z-]+)\s*=\s*["']([^"']*)["']/g)) {
    attrs[match[1].toLowerCase()] = match[2];
  }
  return attrs;
}

export function findTags(html: string, tagName: "meta" | "link"): string[] {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, "gi"))].map((m) => m[0]);
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/**
 * Text pulled straight from raw HTML (title text, meta attribute values,
 * etc.) still contains literal entities like `&#39;` or `&amp;` — decoding
 * matters anywhere text length or exact content is compared against what a
 * reader would actually see. Centralized here after the same fix was
 * applied to `<meta>` content but initially missed on `<title>` text
 * (confirmed live: airbnb.com's title contains a raw `&amp;`) — one shared
 * function so a future new extraction site doesn't reintroduce the gap.
 */
export function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-zA-Z]+);/g, (match, name) => NAMED_ENTITIES[name.toLowerCase()] ?? match);
}
