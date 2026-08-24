import { describe, expect, it } from "vitest";
import { checkIndexability } from "../indexability";

describe("checkIndexability", () => {
  it("detects noindex via meta name=robots", () => {
    const html = `<meta name="robots" content="noindex, follow">`;
    expect(checkIndexability(html, null).noindex).toBe(true);
  });

  it("detects nosnippet via meta name=robots", () => {
    const html = `<meta name="robots" content="nosnippet">`;
    expect(checkIndexability(html, null).nosnippet).toBe(true);
  });

  it("detects noindex regardless of attribute order (content before name)", () => {
    const html = `<meta content="noindex" name="robots"/>`;
    expect(checkIndexability(html, null).noindex).toBe(true);
  });

  it("detects directives scoped to name=googlebot too", () => {
    const html = `<meta name="googlebot" content="noindex">`;
    expect(checkIndexability(html, null).noindex).toBe(true);
  });

  it("reports both false when robots meta is absent or permissive", () => {
    expect(checkIndexability("<title>fine</title>", null).noindex).toBe(false);
    expect(checkIndexability(`<meta name="robots" content="index, follow">`, null).noindex).toBe(
      false,
    );
  });

  it("detects noindex via the X-Robots-Tag header even with no meta tag at all", () => {
    expect(checkIndexability("<title>fine</title>", "noindex").noindex).toBe(true);
  });

  it("detects nosnippet via the X-Robots-Tag header", () => {
    expect(checkIndexability("<title>fine</title>", "noindex, nosnippet").nosnippet).toBe(true);
  });

  it("strips a leading user-agent prefix on the X-Robots-Tag header, e.g. 'googlebot: noindex'", () => {
    expect(checkIndexability("<title>fine</title>", "googlebot: noindex").noindex).toBe(true);
  });

  it("is blocked if either the meta tag or the header says noindex, not just both together", () => {
    const metaOnly = checkIndexability(`<meta name="robots" content="noindex">`, null);
    const headerOnly = checkIndexability("<title>fine</title>", "noindex");
    expect(metaOnly.noindex).toBe(true);
    expect(headerOnly.noindex).toBe(true);
  });

  it("reports both false when there's no header and a permissive or absent meta tag", () => {
    expect(checkIndexability("<title>fine</title>", null).noindex).toBe(false);
    expect(checkIndexability("<title>fine</title>", null).nosnippet).toBe(false);
  });
});
