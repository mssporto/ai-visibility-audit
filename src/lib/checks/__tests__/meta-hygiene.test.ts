import { describe, expect, it } from "vitest";
import { checkMetaHygiene } from "../meta-hygiene";

describe("checkMetaHygiene: attribute order independence", () => {
  it("finds description/canonical/viewport with name-then-content order", () => {
    const html = `
      <title>Acme</title>
      <meta name="description" content="A page about widgets and gadgets for everyone." />
      <link rel="canonical" href="https://example.com/" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <h1>Welcome</h1>
    `;
    const result = checkMetaHygiene(html);
    expect(result.description).toBe("A page about widgets and gadgets for everyone.");
    expect(result.canonical).toBe("https://example.com/");
    expect(result.viewport).toBe("width=device-width, initial-scale=1");
  });

  it("finds description/canonical/viewport with content-first order (Webflow's actual output)", () => {
    // Regression: webflow.com serves attributes in this exact reversed order,
    // which an earlier, order-assuming regex silently missed entirely.
    const html = `
      <title>Webflow</title>
      <meta content="Design, build, optimize, and rank in AI search: all in Webflow." name="description"/>
      <link href="https://webflow.com" rel="canonical"/>
      <meta content="width=device-width, initial-scale=1" name="viewport"/>
      <h1>Webflow</h1>
    `;
    const result = checkMetaHygiene(html);
    expect(result.description).toBe(
      "Design, build, optimize, and rank in AI search: all in Webflow.",
    );
    expect(result.canonical).toBe("https://webflow.com");
    expect(result.viewport).toBe("width=device-width, initial-scale=1");
  });

  it("doesn't confuse og:description or twitter:description with the real description", () => {
    const html = `
      <title>Acme</title>
      <meta content="OG version" property="og:description"/>
      <meta content="Twitter version" name="twitter:description"/>
      <meta content="The real meta description, fifty-plus characters long here." name="description"/>
    `;
    expect(checkMetaHygiene(html).description).toBe(
      "The real meta description, fifty-plus characters long here.",
    );
  });

  it("decodes HTML entities in the description before measuring length", () => {
    // Regression: github.com's real description contains &#39; (an
    // apostrophe), undecoded; that's 4 extra characters per occurrence,
    // which can wrongly push a description outside the 50-160 char window.
    const html = `<meta content="Join the world&#39;s most widely adopted &amp; loved platform." name="description"/>`;
    const result = checkMetaHygiene(html);
    expect(result.description).toBe("Join the world's most widely adopted & loved platform.");
  });

  it("decodes HTML entities in the title too (real airbnb.com fixture)", () => {
    // Regression: the description-decoding fix initially missed the title,
    // which uses a separate extraction path: airbnb.com's real title
    // contains a raw &amp; that was left undecoded.
    const html = `<title>Airbnb: Vacation Rentals, Cabins, Beach Houses, Unique Homes &amp; Experiences</title>`;
    expect(checkMetaHygiene(html).title).toBe(
      "Airbnb: Vacation Rentals, Cabins, Beach Houses, Unique Homes & Experiences",
    );
  });

  it("returns null fields when nothing is present", () => {
    const result = checkMetaHygiene("<html><body>no head tags here</body></html>");
    expect(result.description).toBeNull();
    expect(result.canonical).toBeNull();
    expect(result.viewport).toBeNull();
  });
});
