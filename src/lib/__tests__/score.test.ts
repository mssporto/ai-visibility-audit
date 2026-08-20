import { describe, expect, it } from "vitest";
import { buildAuditReport } from "../score";

const MINIMAL_HTML = `<html><head><title>Acme</title></head><body></body></html>`;

describe("buildAuditReport — noindex override", () => {
  it("forces both scores to 0 when noindex is present, no matter how good everything else is", () => {
    const excellentButNoindexed = `
      <html><head>
        <title>Great Page</title>
        <meta name="description" content="A genuinely excellent, well-optimized fifty-plus-character description." />
        <link rel="canonical" href="https://example.com/" />
        <meta name="robots" content="noindex">
        <script type="application/ld+json">{"@type":"Organization","name":"Acme"}</script>
      </head><body><h1>Great Page</h1></body></html>
    `;
    const report = buildAuditReport(
      "https://example.com/",
      excellentButNoindexed,
      null,
      "https://example.com",
      true,
      false,
    );
    expect(report.blockedFromIndexing).toBe(true);
    expect(report.aeoScore).toBe(0);
    expect(report.geoScore).toBe(0);
    expect(report.recommendations.some((r) => r.title.includes("noindex"))).toBe(true);
  });

  it("does not zero scores when there's no noindex directive", () => {
    const report = buildAuditReport(
      "https://example.com/",
      MINIMAL_HTML,
      null,
      "https://example.com",
      true,
      false,
    );
    expect(report.blockedFromIndexing).toBe(false);
  });
});

describe("buildAuditReport — sitemap contribution", () => {
  it("scores strictly higher on both AEO and GEO when a sitemap is present", () => {
    const withSitemap = buildAuditReport(
      "https://example.com/",
      MINIMAL_HTML,
      null,
      "https://example.com",
      true,
      false,
    );
    const withoutSitemap = buildAuditReport(
      "https://example.com/",
      MINIMAL_HTML,
      null,
      "https://example.com",
      false,
      false,
    );

    expect(withSitemap.aeoScore).toBeGreaterThan(withoutSitemap.aeoScore);
    expect(withSitemap.geoScore).toBeGreaterThan(withoutSitemap.geoScore);
  });

  it("recommends adding a sitemap only when one is missing", () => {
    const withoutSitemap = buildAuditReport(
      "https://example.com/",
      MINIMAL_HTML,
      null,
      "https://example.com",
      false,
      false,
    );
    const withSitemap = buildAuditReport(
      "https://example.com/",
      MINIMAL_HTML,
      null,
      "https://example.com",
      true,
      false,
    );

    expect(withoutSitemap.recommendations.some((r) => r.title === "sitemap.xml")).toBe(true);
    expect(withSitemap.recommendations.some((r) => r.title === "sitemap.xml")).toBe(false);
  });

  it("llms.txt presence never affects either score", () => {
    const withLlmsTxt = buildAuditReport(
      "https://example.com/",
      MINIMAL_HTML,
      null,
      "https://example.com",
      true,
      true,
    );
    const withoutLlmsTxt = buildAuditReport(
      "https://example.com/",
      MINIMAL_HTML,
      null,
      "https://example.com",
      true,
      false,
    );

    expect(withLlmsTxt.aeoScore).toBe(withoutLlmsTxt.aeoScore);
    expect(withLlmsTxt.geoScore).toBe(withoutLlmsTxt.geoScore);
  });
});
