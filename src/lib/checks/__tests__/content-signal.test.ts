import { describe, expect, it } from "vitest";
import { checkContentSignal } from "../content-signal";

describe("checkContentSignal", () => {
  it("returns not found when robots.txt is null", () => {
    expect(checkContentSignal(null)).toEqual({ found: false, raw: null });
  });

  it("returns not found when robots.txt has no Content-Signal line", () => {
    const robotsTxt = "User-agent: *\nDisallow:";
    expect(checkContentSignal(robotsTxt)).toEqual({ found: false, raw: null });
  });

  it("finds a Content-Signal line and reports its raw value", () => {
    const robotsTxt = "User-agent: *\nContent-Signal: search=yes, ai-train=no";
    expect(checkContentSignal(robotsTxt)).toEqual({
      found: true,
      raw: "search=yes, ai-train=no",
    });
  });

  it("matches case-insensitively", () => {
    const robotsTxt = "content-signal: search=yes";
    expect(checkContentSignal(robotsTxt)).toEqual({ found: true, raw: "search=yes" });
  });
});
