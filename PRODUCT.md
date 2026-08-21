# Product

## Register

brand

## Users

Visitors to Dahiana's portfolio — potential clients, recruiters, collaborators, and fellow
builders — evaluating her design/engineering craft. They arrive casually (referred from a
portfolio link), expect to be impressed quickly, and also want the tool itself to genuinely work:
a real AEO/GEO visibility score for a URL they paste in, not just a pretty shell.

## Product Purpose

A free, real AEO/GEO visibility audit — paste a URL, get an accurate score — built specifically
as a portfolio centerpiece. Its job is to prove elite frontend craft *and* deliver a genuinely
useful, correct result; neither half can be sacrificed for the other.

## Brand Personality

**Superseded direction (kept for record, not current):** an earlier "clinic visit" skeuomorphic
concept (Uniqlo/Muji/skeuomorphism references, a waiting room / lightbox / note / lab-sheet
narrative) was fully designed, built, and tested — then explicitly rejected by the user as not
what they wanted, twice over two different attempts. See git history on this branch for that
work. Do not resurrect it without a fresh, explicit decision to do so.

**Current direction:** "Modern Utility" — clarity over decoration, extreme readability,
functional confidence. High contrast, minimal ornament, generous whitespace, structured data
rows. The interface should feel like a precise diagnostic instrument, not an atmospheric scene.
This came from the user directly (a design system they generated and approved elsewhere), not
from an internal design process — treat `design.md`'s "Modern Utility Design System" as the
settled spec, not a starting point to iterate away from without being asked.

## Anti-references

- The clinic-visit concept (see above) — flat vs. textured was never the actual problem; the
  *whole metaphor* was rejected, not just its execution. Don't reintroduce skeuomorphism, warm
  kraft/paper tones, or physical-object staging.
- Any unnecessary texture, shadow, gradient, or decorative motion on top of the current Modern
  Utility system — "clarity over decoration" is the explicit standing instruction now, not a
  suggestion to push against.
- Glassmorphism, gradient text, side-stripe card borders, identical repeated card grids, tiny
  uppercase tracked eyebrows above every section, numbered 01/02/03 section markers where the
  content isn't actually a sequence.

## Design Principles

1. **Follow the approved spec exactly.** `design.md`'s Modern Utility system is a settled
   decision, not raw material for further creative reinterpretation — implement it faithfully,
   including its literal pure-black/white choices (an explicit, deliberate override of this
   project's general house rule against pure black/white fills).
2. **Function and legibility come first.** Every element earns its place by being useful; strip
   anything that doesn't directly help someone read their audit result quickly.
3. **High contrast, real status signaling.** Pass/fail states use color *and* an icon/label,
   never color alone.
4. **Motion is minimal and functional** (progress-bar fills, button hover/active states, scroll-
   to-result) — not an orchestrated experience. Don't add decorative animation back in.
5. **The report stays a real, usable tool.** The actual AEO/GEO scores, category breakdown, and
   recommendations must stay scannable and legible above all else.

## Accessibility & Inclusion

WCAG 2.1/2.2 AA minimum: body text ≥4.5:1 contrast, large text ≥3:1, full keyboard navigation,
visible focus states, semantic landmarks, alt text on every meaningful image. Every animation
needs a `prefers-reduced-motion` alternative (crossfade or instant, never content gated behind
motion). Never color-only signaling (e.g. the lab-results "flag" needs an icon/label too).
