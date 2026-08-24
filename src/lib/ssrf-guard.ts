const IPV4_PATTERN = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function isPrivateIPv4(hostname: string): boolean {
  const match = hostname.match(IPV4_PATTERN);
  if (!match) return false;
  const [a, b] = [Number(match[1]), Number(match[2])];
  if (a === 127) return true; // loopback
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 169 && b === 254) return true; // link-local / cloud metadata
  if (a === 0) return true; // 0.0.0.0/8
  return false;
}

/**
 * Decodes the trailing two hex groups of an embedded-IPv4 IPv6 literal (the
 * form `url.hostname` actually contains, e.g. "7f00:1" for 127.0.0.1) back
 * into dotted-decimal, so it can be run through `isPrivateIPv4`.
 */
function ipv4FromHexGroups(high: string, low: string): string {
  const hex = high.padStart(4, "0") + low.padStart(4, "0");
  const bytes = [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6), hex.slice(6, 8)];
  return bytes.map((byte) => parseInt(byte, 16)).join(".");
}

function isPrivateIPv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (normalized === "::1") return true; // loopback
  if (normalized === "::") return true; // unspecified
  if (/^f[cd][0-9a-f]{2}:/.test(normalized)) return true; // fc00::/7 unique-local
  if (/^fe80:/.test(normalized)) return true; // link-local

  // IPv4-mapped (::ffff:0:0/96) and NAT64 (64:ff9b::/96) addresses embed a
  // real IPv4 address in the last 32 bits. `new URL(...)` canonicalizes any
  // dotted-decimal or hex form of these into "<prefix>:<hex>:<hex>" before
  // this function ever sees it, so the embedded address must be decoded and
  // re-checked against the IPv4 blocklist rather than treated as opaque IPv6.
  const embedded =
    normalized.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/) ??
    normalized.match(/^64:ff9b::([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (embedded && isPrivateIPv4(ipv4FromHexGroups(embedded[1], embedded[2]))) return true;

  return false;
}

export function isBlockedFetchTarget(rawUrl: string): boolean {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return true; // unparseable input is not a safe fetch target
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return true;

  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost")) return true;

  if (isPrivateIPv4(hostname)) return true;
  if (isPrivateIPv6(hostname)) return true;

  return false;
}
