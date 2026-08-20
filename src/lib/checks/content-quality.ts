export interface ContentQualityResult {
  hasNumbers: boolean;
  hasBlockquote: boolean;
  hasOutboundLinks: boolean;
  hasMultipleH2: boolean;
  hasListOrTable: boolean;
  hasQuestionHeading: boolean;
  hasTldrHeading: boolean;
  score: number; // 0-100
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ");
}

function getHeadings(html: string): string[] {
  return [...html.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi)].map((m) =>
    stripTags(m[1]).trim(),
  );
}

export function checkContentQuality(html: string, siteOrigin: string): ContentQualityResult {
  const bodyText = stripTags(html);
  const headings = getHeadings(html);

  const hasNumbers = /\b\d{2,}\b/.test(bodyText) || /\b\d+%\b/.test(bodyText);
  const hasBlockquote = /<blockquote[\s>]/i.test(html);
  const h2Count = (html.match(/<h2[\s>]/gi) ?? []).length;
  const hasMultipleH2 = h2Count >= 2;
  const hasListOrTable = /<(ul|ol|table)[\s>]/i.test(html);
  const hasQuestionHeading = headings.some((h) => h.trim().endsWith("?"));
  const hasTldrHeading = headings.some((h) =>
    /^(tl;?dr|key takeaways?|summary|at a glance)/i.test(h.trim()),
  );

  const outboundLinks = [...html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)]
    .map((m) => m[1])
    .filter((href) => /^https?:\/\//i.test(href) && !href.includes(siteOrigin));
  const hasOutboundLinks = outboundLinks.length > 0;

  let score = 0;
  if (hasNumbers) score += 15;
  if (hasBlockquote) score += 15;
  if (hasOutboundLinks) score += 15;
  if (hasMultipleH2) score += 15;
  if (hasListOrTable) score += 15;
  if (hasQuestionHeading) score += 15;
  if (hasTldrHeading) score += 10;

  return {
    hasNumbers,
    hasBlockquote,
    hasOutboundLinks,
    hasMultipleH2,
    hasListOrTable,
    hasQuestionHeading,
    hasTldrHeading,
    score: Math.min(score, 100),
  };
}
