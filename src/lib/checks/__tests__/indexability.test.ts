import { describe, expect, it } from "vitest";
import { checkIndexability } from "../indexability";

describe("checkIndexability", () => {
  it("detects noindex via meta name=robots", () => {
    const html = `<meta name="robots" content="noindex, follow">`;
    expect(checkIndexability(html).noindex).toBe(true);
  });

  it("detects nosnippet via meta name=robots", () => {
    const html = `<meta name="robots" content="nosnippet">`;
    expect(checkIndexability(html).nosnippet).toBe(true);
  });

  it("detects noindex regardless of attribute order (content before name)", () => {
    const html = `<meta content="noindex" name="robots"/>`;
    expect(checkIndexability(html).noindex).toBe(true);
  });

  it("detects directives scoped to name=googlebot too", () => {
    const html = `<meta name="googlebot" content="noindex">`;
    expect(checkIndexability(html).noindex).toBe(true);
  });

  it("reports both false when robots meta is absent or permissive", () => {
    expect(checkIndexability("<title>fine</title>").noindex).toBe(false);
    expect(checkIndexability(`<meta name="robots" content="index, follow">`).noindex).toBe(
      false,
    );
  });
});
