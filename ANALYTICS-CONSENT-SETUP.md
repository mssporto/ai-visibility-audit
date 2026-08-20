# Analytics + GDPR Consent Setup Guide

A reusable, framework-agnostic runbook for wiring up Google Tag Manager (GTM), Google Analytics 4 (GA4), and a GDPR/ePrivacy-compliant consent banner. Written from a real implementation (Astro + `vanilla-cookieconsent`), but every piece here applies regardless of stack — React, Vue, plain HTML, Django templates, whatever renders your `<head>`.

Treat this as a checklist, not just reference reading. The consent-mode wiring in particular has one specific gotcha (§5) that produces a bug which *looks* like a GTM configuration problem but isn't — read that section even if you skip the rest.

---

## 1. Create the GTM container

1. [tagmanager.google.com](https://tagmanager.google.com) → create an account + container (choose "Web" as the target platform).
2. You'll get a container ID like `GTM-XXXXXXX` and two code snippets: a `<head>` script and a `<body>` `<noscript>` iframe. Keep both — you need both.
3. Do **not** paste GTM's snippet verbatim yet. It needs to be preceded by the Consent Mode default call (§4) and the `<noscript>` block needs a tiny CSS tweak (§3).

## 2. Create the GA4 property

1. [analytics.google.com](https://analytics.google.com) → Admin → create a property → create a Web data stream for your domain.
2. Note the Measurement ID (`G-XXXXXXXXXX`).
3. In GTM: **Tags → New → Google tag** (this is the unified tag type — not the older separate "GA4 Configuration" type if your GTM UI still offers both). Set the Tag ID to your `G-XXXXXXXXXX`. Trigger: **All Pages**.
4. Don't expect data in GA4's standard reports immediately — Realtime shows within minutes, but the main reporting views have a 24–48h processing delay. "Data collection isn't active" warnings on a fresh, low-traffic property are a benign artifact of this delay, not a misconfiguration signal.

## 3. Embed the snippets in your HTML

Framework-specific detail (where "head" and "body" partials live) varies, but the shape is universal:

```html
<head>
  <!-- 1. Consent Mode default — MUST be the literal first script, see §4 -->
  <script>/* consent default snippet, §4 */</script>

  <!-- 2. GTM container loader — immediately after -->
  <script>
    (function (w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      var f = d.getElementsByTagName(s)[0], j = d.createElement(s),
          dl = l !== 'dataLayer' ? '&l=' + l : '';
      j.async = true;
      j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', 'GTM-XXXXXXX');
  </script>
</head>
<body>
  <!-- 3. Noscript fallback — first thing in body -->
  <noscript>
    <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
            height="0" width="0" style="display:none;visibility:hidden"></iframe>
  </noscript>
  <!-- rest of your page -->
</body>
```

Notes:
- The `style="display:none;visibility:hidden"` on the noscript iframe isn't cosmetic — without it, some browsers reserve layout space for a 0×0 iframe and you get a 1px shift.
- If your framework has a strict Content Security Policy (recommended — see §7), you'll need `https://www.googletagmanager.com` allow-listed in `script-src`, `img-src`, `connect-src`, and `frame-src`.

## 4. Google Consent Mode v2 — the default call

This is the mechanism that tells Google's tags what a visitor has (not) consented to, before you know their answer. Two states matter: `default` (pessimistic starting point, set before GTM loads) and `update` (pushed once the user answers your banner).

**The single most important rule in this entire guide:** the default call **must use the actual `gtag()` function**, not a hand-rolled `dataLayer.push(['consent', 'default', {...}])` array. See §5 for why — this one substitution is responsible for a very convincing, very hard-to-spot bug.

```html
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  window.gtag = gtag; // expose it so your consent-banner script can call gtag('consent','update',...) later
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500 // ms GTM waits for an update signal before proceeding with the default
  });
</script>
```

This script must be:
- **The first script in `<head>`**, before the GTM loader snippet — not deferred, not async, not a bundled/processed module script that your build tool might reorder. Verify by viewing **rendered page source** (curl the URL or "View Page Source", not DevTools' live-modified DOM) and confirming this script literally precedes `gtm.js` in the delivered HTML.
- Present on **every page**, not just the homepage.

When the user answers your consent banner, push an update the same way:

```js
window.gtag('consent', 'update', {
  analytics_storage: userAcceptedAnalytics ? 'granted' : 'denied',
  ad_storage: userAcceptedMarketing ? 'granted' : 'denied',
  ad_user_data: userAcceptedMarketing ? 'granted' : 'denied',
  ad_personalization: userAcceptedMarketing ? 'granted' : 'denied',
});
```

## 5. The gotcha: `dataLayer.push(array)` vs. `gtag()`

`gtag()` is defined as `function gtag(){ dataLayer.push(arguments); }`. It pushes the `arguments` object — an array-*like* structure, but not a real JavaScript `Array`. GTM's internal Consent API listener is built to recognize specifically that shape.

If you instead write:

```js
// LOOKS equivalent. Is NOT equivalent. Silently broken.
window.dataLayer.push(['consent', 'default', { analytics_storage: 'denied', /* ... */ }]);
```

...it renders identically in a dataLayer inspector (`['consent', 'default', {...}]`), so nothing *looks* wrong when you debug it. But GTM never updates its internal consent state from it. Every tag then fires **unconditionally**, completely ignoring whatever consent checkboxes you've configured on the tags themselves.

**Symptom:** analytics cookies (`_ga`, etc.) get set on the very first page load with zero user interaction — even though script order is correct, the dataLayer clearly shows the "denied" default, and the GTM tag's consent settings look properly configured. This symptom sends you chasing the wrong thing (tag-level "Additional Consent Checks" vs. built-in consent checks, script ordering, GTM publish state) when the actual bug is upstream of all of that, in the JS that pushes the consent signal itself.

**Fix:** always route both the default and update calls through a real `gtag()` shim (§4), even in GTM-only setups where you never load `gtag.js` directly. This is Google's own documented pattern — it applies whether or not you're using `gtag.js` as a script, because GTM's consent listener expects `gtag()`'s call shape either way.

**Verify the fix**, don't just trust the dataLayer inspector:
1. Clear cookies, open DevTools → Network, reload the page fresh, and **don't touch the consent banner**.
2. Find the GA4 collection request (`POST .../g/collect?...`).
3. Check its query string for `gcs=G100` and `pscdl=denied` — this means GA4 is sending a cookieless, denied-consent ping. If instead you see a real persisted `cid=` matching a `_ga` cookie value, consent isn't being respected.
4. Check `document.cookie` — no `_ga`/`_ga_*` cookies should exist yet.
5. Accept the banner, reload, and confirm cookies now appear and the collect request carries `gcs=G1..` reflecting granted state.

## 6. Consent banner UI

Any GDPR-compliant consent library works; the requirements below are stack-agnostic. (Reference implementation used `vanilla-cookieconsent`, MIT-licensed, no dependencies.)

**Non-negotiable compliance requirements (EU/GDPR + ePrivacy):**
- **Opt-in by default.** Nothing beyond strictly necessary cookies fires until the user actively grants consent. No geo-gating exception — apply the same opt-in default to every visitor regardless of detected location, since geo-detection is unreliable (VPNs, proxies) and the safe default is uniform compliance.
- **Equal-weight Accept/Reject.** A visually prominent "Accept All" next to a buried or smaller "Reject"/"Necessary Only" button is a known dark-pattern violation regulators flag. Both primary actions should be equally easy to find and click.
- **Granular categories**, typically at minimum: Necessary (always on, not togglable), Analytics, Marketing. Split further only if you actually use more distinct cookie purposes.
- **Persistent access to change consent later** — a "Manage cookies" link/button reachable from every page (commonly in the footer or a dedicated cookie-policy page), not just a one-time banner.
- **Cookie auto-clear on reject.** Rejecting consent must not just stop *new* cookies — it must actively delete cookies already set for that category. Most libraries need this configured explicitly (e.g. a regex pattern matching `_ga`-prefixed cookie names tied to the analytics category); it is not automatic just because the category is "off." Missing this is easy to mistake for "consent gating isn't working" when it's really just a missing cleanup rule.
- **A cookie policy page** listing only the cookies your site *actually* sets — name, provider, duration, purpose — not a generic template copied from elsewhere with cookies (Facebook, YouTube embeds, etc.) you don't actually use.

**Implementation-agnostic wiring pattern**, regardless of library:

```js
function onConsentChange(categories /* e.g. ['necessary', 'analytics'] */) {
  const granted = (cat) => categories.includes(cat) ? 'granted' : 'denied';
  window.gtag('consent', 'update', {
    analytics_storage: granted('analytics'),
    ad_storage: granted('marketing'),
    ad_user_data: granted('marketing'),
    ad_personalization: granted('marketing'),
  });
}
// Wire this to your library's onFirstConsent / onConsent / onChange callbacks
```

## 7. GTM tag-level consent settings — what to configure and what to skip

On each tag in GTM (the "Google tag" for GA4, and any other Google tag types):

- **Do configure** the tag's own **Consent Settings** section if your GTM version separates "which consent signals this tag cares about" from the global default — check `Analytics Storage` (and `Ad Storage` for marketing tags) as required signals.
- **Don't add "Additional Consent Checks"** on top of a native Google tag type. Google's own docs warn this causes conflicts: the Google tag already has built-in consent-aware behavior (sends a cookieless ping when denied, switches to normal hits once granted), and stacking Additional Consent Checks on top makes it behave unpredictably instead of blocking cleanly. There's also a documented bug (Simo Ahava) where Additional Consent Checks consume the tag's "fire once per page" budget even while blocked — so if consent is granted later in the same session, the tag can silently never fire on that page load, because GTM already considers it "fired" (blocked).
- **Only use Additional Consent Checks** on non-Google tag types with no native consent awareness (e.g. a Meta Pixel loaded via Custom HTML tag).
- After any tag change: **Publish a new container version.** Editing tags in the GTM UI does nothing to the live site until published — an easy step to forget mid-debugging.

## 8. Content Security Policy (if your stack enforces one)

If you run a strict CSP with no `unsafe-inline`/`unsafe-eval`, allow-list only what's needed:

```
script-src: https://www.googletagmanager.com
img-src: https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com
connect-src: https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com
frame-src: https://www.googletagmanager.com
```
Never widen a CSP beyond what's demonstrably required — verify by checking browser console for CSP violation errors after wiring things up, and only add the specific origin that was actually blocked.

## 9. End-to-end verification checklist

Run this after every setup, on the **live/deployed** site, not just local dev (a container publish or a build config can behave differently once deployed):

- [ ] View rendered page source: consent-default script literally precedes the GTM loader script.
- [ ] Incognito/private window, DevTools → Application → Cookies: empty before any interaction.
- [ ] Reload without touching the banner: DevTools → Network → GA4 `collect` request shows `gcs=G100`-style denied encoding and `pscdl=denied`; no `_ga` cookie appears.
- [ ] Click "Reject"/"Necessary Only": confirm no new analytics cookies appear, and any that existed from a prior session get cleared.
- [ ] Click "Accept All": confirm `_ga`/`_ga_*` cookies now appear and subsequent `collect` requests show granted consent encoding.
- [ ] Reopen "Manage cookies" from wherever you placed that link/button — confirm it reopens the preferences panel with the current choice reflected.
- [ ] GTM Preview mode against the live URL: confirm the Consent tab shows the correct default/update values at the expected points in the timeline.
- [ ] GA4 Realtime report: confirm a test pageview after granting consent shows up within a few minutes.

---

**Sources for the core Consent Mode / GTM gotcha in §5:** Google's official Tag Platform consent documentation (developers.google.com/tag-platform/security/guides/consent), Simo Ahava's Consent Mode v2 writeups (simoahava.com), and empirical verification via direct network-request inspection — GTM's own UI/Preview mode can appear correct while the live published container behaves differently, so always verify against actual network traffic, not just the tool's diagnostic views.
