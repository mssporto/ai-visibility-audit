import { describe, expect, it } from "vitest";
import { checkEntityClarity } from "../entity-clarity";

describe("checkEntityClarity — About-page detection", () => {
  it("detects a separate /about page", () => {
    const html = `<title>Acme Co</title><a href="/about">About</a>`;
    expect(checkEntityClarity(html).hasAboutPage).toBe(true);
  });

  it("detects a single-page anchor section (#about)", () => {
    const html = `<title>Acme Co</title><a href="#about">About</a>`;
    expect(checkEntityClarity(html).hasAboutPage).toBe(true);
  });

  it("detects a single-page anchor section (#about-us)", () => {
    const html = `<title>Acme Co</title><a href="#about-us">About us</a>`;
    expect(checkEntityClarity(html).hasAboutPage).toBe(true);
  });

  it("detects an id-based About section with no matching link", () => {
    const html = `<title>Acme Co</title><section id="about">...</section>`;
    expect(checkEntityClarity(html).hasAboutPage).toBe(true);
  });

  it("reports false when there's genuinely no About content", () => {
    const html = `<title>Acme Co</title><a href="/pricing">Pricing</a>`;
    expect(checkEntityClarity(html).hasAboutPage).toBe(false);
  });
});
