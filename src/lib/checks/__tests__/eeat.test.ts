import { describe, expect, it } from "vitest";
import { checkEeat } from "../eeat";

describe("checkEeat — publish date detection", () => {
  it("detects a visible <time> tag", () => {
    const html = `<time datetime="2026-01-01">Jan 1</time>`;
    expect(checkEeat(html, "https://example.com").hasPublishDate).toBe(true);
  });

  it("detects a JSON-LD dateModified field even with no <time> tag anywhere", () => {
    // Regression: dahiana.work's real JSON-LD has a ProfilePage with
    // dateModified but no <time> tag on the page — a <time>-only check
    // reports this as "no date signal" when Google's own recommended
    // mechanism (JSON-LD datePublished/dateModified) is right there.
    const html = `
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "ProfilePage", "dateModified": "2026-08-19T11:13:59.466Z" }
        ]
      }
      </script>
    `;
    expect(checkEeat(html, "https://example.com").hasPublishDate).toBe(true);
  });

  it("detects a JSON-LD datePublished field on an Article", () => {
    const html = `
      <script type="application/ld+json">
      { "@type": "Article", "datePublished": "2021-07-20T08:00:00+08:00" }
      </script>
    `;
    expect(checkEeat(html, "https://example.com").hasPublishDate).toBe(true);
  });

  it("reports no date signal when genuinely none is present", () => {
    const html = `<title>No dates here</title>`;
    expect(checkEeat(html, "https://example.com").hasPublishDate).toBe(false);
  });

  it("doesn't crash on malformed JSON-LD", () => {
    const html = `<script type="application/ld+json">{ not valid json </script>`;
    expect(() => checkEeat(html, "https://example.com")).not.toThrow();
  });
});
