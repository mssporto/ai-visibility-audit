import { describe, expect, it } from "vitest";
import { checkStructuredData } from "../structured-data";

describe("checkStructuredData — Organization subtype recognition", () => {
  it("counts a plain Organization type", () => {
    const html = `<script type="application/ld+json">{"@type":"Organization","name":"Acme"}</script>`;
    expect(checkStructuredData(html).hasOrganization).toBe(true);
  });

  it("counts Corporation as an Organization subtype (real shopify.com fixture)", () => {
    // Regression: shopify.com's real homepage JSON-LD uses "@type":
    // "Corporation" — schema.org's own hierarchy is Thing > Organization >
    // Corporation (https://schema.org/Corporation), so this should count.
    const html = `<script type="application/ld+json">{"@type":"Corporation","name":"Shopify","legalName":"Shopify Inc."}</script>`;
    expect(checkStructuredData(html).hasOrganization).toBe(true);
  });

  it("counts LocalBusiness as an Organization subtype", () => {
    const html = `<script type="application/ld+json">{"@type":"LocalBusiness","name":"Joe's Diner"}</script>`;
    expect(checkStructuredData(html).hasOrganization).toBe(true);
  });

  it("does not count an unrelated type", () => {
    const html = `<script type="application/ld+json">{"@type":"Recipe","name":"Pancakes"}</script>`;
    expect(checkStructuredData(html).hasOrganization).toBe(false);
  });
});
