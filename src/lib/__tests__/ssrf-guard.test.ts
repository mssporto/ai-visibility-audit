import { describe, expect, it } from "vitest";
import { isBlockedFetchTarget } from "../ssrf-guard";

describe("isBlockedFetchTarget", () => {
  it("blocks IPv4 loopback", () => {
    expect(isBlockedFetchTarget("http://127.0.0.1/")).toBe(true);
  });

  it("allows a normal public domain", () => {
    expect(isBlockedFetchTarget("https://example.com/")).toBe(false);
  });

  it("blocks localhost by name", () => {
    expect(isBlockedFetchTarget("http://localhost/")).toBe(true);
  });

  it("blocks private 10.0.0.0/8", () => {
    expect(isBlockedFetchTarget("http://10.1.2.3/")).toBe(true);
  });

  it("blocks private 192.168.0.0/16", () => {
    expect(isBlockedFetchTarget("http://192.168.1.1/")).toBe(true);
  });

  it("blocks private 172.16.0.0/12 at the low edge", () => {
    expect(isBlockedFetchTarget("http://172.16.0.1/")).toBe(true);
  });

  it("blocks private 172.16.0.0/12 at the high edge", () => {
    expect(isBlockedFetchTarget("http://172.31.255.255/")).toBe(true);
  });

  it("allows 172.32.0.1 (just outside the private range)", () => {
    expect(isBlockedFetchTarget("http://172.32.0.1/")).toBe(false);
  });

  it("blocks link-local / cloud metadata 169.254.0.0/16", () => {
    expect(isBlockedFetchTarget("http://169.254.169.254/")).toBe(true);
  });

  it("blocks non-http(s) schemes", () => {
    expect(isBlockedFetchTarget("file:///etc/passwd")).toBe(true);
    expect(isBlockedFetchTarget("ftp://example.com/")).toBe(true);
  });

  it("blocks IPv6 loopback", () => {
    expect(isBlockedFetchTarget("http://[::1]/")).toBe(true);
  });

  it("blocks IPv6 unique-local addresses (fc00::/7)", () => {
    expect(isBlockedFetchTarget("http://[fd00::1]/")).toBe(true);
  });

  it("blocks an IPv4-mapped IPv6 loopback literal", () => {
    expect(isBlockedFetchTarget("http://[::ffff:127.0.0.1]/")).toBe(true);
  });

  it("blocks an IPv4-mapped IPv6 cloud-metadata literal", () => {
    expect(isBlockedFetchTarget("http://[::ffff:169.254.169.254]/")).toBe(true);
  });

  it("blocks an IPv4-mapped IPv6 private 10.0.0.0/8 literal", () => {
    expect(isBlockedFetchTarget("http://[::ffff:10.0.0.1]/")).toBe(true);
  });

  it("blocks the already-canonicalized hex form of an IPv4-mapped address", () => {
    expect(isBlockedFetchTarget("http://[::ffff:a9fe:a9fe]/")).toBe(true);
  });

  it("allows an IPv4-mapped IPv6 literal for a public address", () => {
    expect(isBlockedFetchTarget("http://[::ffff:8.8.8.8]/")).toBe(false);
  });

  it("blocks a NAT64-mapped loopback literal (64:ff9b::/96)", () => {
    expect(isBlockedFetchTarget("http://[64:ff9b::127.0.0.1]/")).toBe(true);
  });
});
