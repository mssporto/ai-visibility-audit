import { decodeEntities, findTags, parseAttributes } from "../html-attrs";

export interface MetaHygieneResult {
  title: string | null;
  description: string | null;
  canonical: string | null;
  viewport: string | null;
  h1Count: number;
  score: number; // 0-100
}

function findMetaContent(html: string, name: string): string | null {
  for (const tag of findTags(html, "meta")) {
    const attrs = parseAttributes(tag);
    if (attrs.name?.toLowerCase() === name && attrs.content) {
      return decodeEntities(attrs.content.trim());
    }
  }
  return null;
}

function findLinkHref(html: string, rel: string): string | null {
  for (const tag of findTags(html, "link")) {
    const attrs = parseAttributes(tag);
    if (attrs.rel?.toLowerCase() === rel && attrs.href) return attrs.href.trim();
  }
  return null;
}

export function checkMetaHygiene(html: string): MetaHygieneResult {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1].trim()) : null;

  const description = findMetaContent(html, "description");
  const canonical = findLinkHref(html, "canonical");
  const viewport = findMetaContent(html, "viewport");
  const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length;

  let score = 0;
  if (title && title.length > 0) score += 25;
  if (description && description.length >= 50 && description.length <= 160) score += 25;
  if (canonical) score += 25;
  if (h1Count === 1) score += 25;

  return { title, description, canonical, viewport, h1Count, score };
}
