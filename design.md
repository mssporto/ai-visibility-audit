# design.md: AI Visibility Audit

## Lumos-based design system

**Supersedes the "Modern Utility Design System" below the fold of this project's history**
(see git log for that version), per explicit instruction on 2026-08-21 to adopt the token
system scaffolded by `npm create lumos@latest` (https://lumosframework.com/), a component and
styling framework for Astro sites, as this project's design foundation.

**Update, same day:** the full Lumos component library (all 19 components: `Section`,
`ContentWrapper`, `Grid`, `ButtonWrapper`, `Heading`, `Paragraph`, `RichText`, `Eyebrow`,
`Button`, `Card`, `Img`, `Video`, `Icon`, `Overlay`, `Nav`, `Footer`, `SkipLink`, `BaseHead`,
`FormattedDate`) is now installed in `src/components/`, per explicit instruction, superseding
the narrower "tokens + reset only" scope described immediately below when this file was first
written. What's actually **wired into the two pages** is still a subset: `BaseHead`, `SkipLink`,
`Nav`, `Footer` (the site shell), and `Section`/`Heading`/`Paragraph`/`ButtonWrapper`/`Button`
(used in both `index.astro` and `results.astro`). `Card`/`Grid`/`ContentWrapper`/`Img`/`Video`/
`Overlay`/`Eyebrow`/`RichText`/`FormattedDate` are installed and available but **not used
anywhere yet**: nothing on either page is a content card, an image, a video, rich markdown, or
dated content, so there's nothing for them to do. They're there for when a real need shows up,
not wired in speculatively.

Lumos's standalone **utility-class library** (`src/styles/utilities.css` in the original
scaffold, ~1,880 lines of `padding-*`/`gap-*`/`flex-*` helper classes) is still **not** ported:
that's a separable, genuinely optional layer for page-authoring convenience, unlike the
component library itself. What *did* need porting from it: a handful of classes several
components generate directly and depend on for correct rendering, namely `.alignment-start/-center/
-end` (`Section`'s `align` prop, `ButtonWrapper`), `.padding-top/-bottom-{0,sitemargin,small,
large,navoverlap}` (`Section`'s `paddingTop`/`paddingBottom` props), and `.min-height-screen`
(`Section`'s `fullHeight` prop). These live in `src/styles/patterns.css` now, not because they're
part of the "structural" layer conceptually, but because leaving them out silently breaks
component props that look like they should work; confirmed the hard way: `Section align="center"`
and a `paddingTop="even"` did nothing until these were added. If a future page reaches for a
Section/Grid/Card prop that generates a class name not yet in `patterns.css`, check there first
before assuming a bug elsewhere.

The original scope (superseded by the update above, kept for history): Lumos itself ships a much
larger surface than this two-page tool needs: a full component library (`Button`, `Card`,
`Grid`, `Section`, `ContentWrapper`, etc.) and a ~1,880-line utility CSS framework sized for a
multi-page marketing site with a real nav menu. What was ported at the time was Lumos's **token
system and base reset** (the part that *is* "the design system": colors, type scale, spacing,
borders/radius, button/link tokens) plus its `Nav`/`Footer`/`SkipLink` shell pattern, restyled
with this project's own copy and no logo asset. The audit form and results dashboard kept their
existing bespoke markup: `Card`/`Grid`/`ContentWrapper` still have no fit for a data dashboard
and are not forced into one now either; only the shell and the generic text/layout primitives
got wired in.

`src/styles/tokens.css` must encode these exact values: the two must never drift; update both
in the same change.

## Core principles

Unchanged from the prior system, still the right fit for a diagnostic tool:

- **Clarity over decoration.** Every element serves a functional purpose.
- **High contrast.** A strict color palette for peak legibility and accessibility compliance.
- **Intentional whitespace.** Generous margins/padding for a focused, low-cognitive-load
  experience.
- **Structured hierarchy.** Data organized in clean rows with clear labels and status indicators.

## Color palette

| Token | Value | Use |
|---|---|---|
| `--background` (`--light-200`) | `#ebebeb` | Page background. |
| `--background-2` (`--light-100`) | `#fdfdfd` | Cards, form fields, footer/nav bars. |
| `--text` (`--dark-900`) | `#1f1d1e` | Headings, primary text, the action button's fill. |
| `--text-faded` | `color-mix(in srgb, var(--text) 70%, transparent)` | Labels, secondary/meta text. |
| `--border` | `color-mix(in lab, var(--text) 20%, transparent)` | Dividers, input strokes. |
| `--success` | `#0f9d68` | "Pass" states, positive progress-bar fill. |
| `--error` | `#dc2626` | "Fail" states, critical alerts. |
| `--error-background` | `#fef2f2` | Error/blocked-banner backgrounds. |

**`--light-100` is `#fdfdfd`, not Lumos's literal `#ffffff`.** It backs a real surface fill
(`--background-2`: cards, form fields, nav/footer bars) and this project's house rule (see
`CLAUDE.md`) forbids pure `#FFFFFF`/`#000000` for backgrounds or large fills, no exception given
for this palette. `--dark-900` (`#1f1d1e`) already clears pure black on its own.

## Typography

- **Font**: Inconsolata (self-hosted via `@fontsource/inconsolata`, weights 400/500/700), set as
  the `--primary-family` token. Replaced Inter project-wide 2026-08-24, explicit instruction —
  a monospace face suits a diagnostic/audit tool's "data readout" feel better than a
  general-purpose sans-serif. Full replacement, not an accent: headings, body, and the wordmark
  all use the same family, differentiated by weight/size/tracking per context (below), not by
  swapping typefaces.
- **Weight tokens**: `--primary-regular` (400), `--primary-medium` (500), `--primary-bold` (700),
  Lumos's own token names, reused directly.
- **Letter-spacing tokens**: `--letter-spacing-tight` (`-0.02em`, headings), `--letter-spacing-normal`
  (`0em`, body).

| Token | Value | Use |
|---|---|---|
| `--text-display` | `clamp(2.25rem, 1.6rem + 3vw, 4rem)` | The landing hero heading. |
| `--text-title` | `clamp(1.25rem, 1.1rem + 0.8vw, 1.75rem)` | Section headings ("Lab results"). |
| `--text-score` | `clamp(2.5rem, 2rem + 2vw, 3.5rem)` | The AEO/GEO score-card values. |
| `--text-logo` | `1.5rem` (24px) | Sizes the nav/footer isotype (icon-only logo, no wordmark). |
| `--text-body` | `1rem` | Body copy. |
| `--text-small` | `0.875rem` | Labels, data-row values. |
| `--text-micro` | `0.75rem` | Corner-widget text, footer copyright. |

These seven are app-specific: Lumos's own scale defines a full `display`/`h1`–`h6` ladder this
app's two pages don't use at that granularity; same `clamp()` technique, sized to what's actually
on the page.

## Spacing & grid

Lumos's own fluid spacing scale, `--space-1` through `--space-8`, unchanged: each a `clamp()`
tied to a 320–1440px viewport range. `rem` units throughout. Landing page: centered
single-column (`--content-max-width: 40rem`). Dashboard: a `repeat(auto-fit, minmax(200px, 1fr))`
score-card row, then a single-column results panel (`--dashboard-max-width: 48rem`). Nav and
footer's inner max-width match Lumos's own site-wide container instead (`--max-width-main`,
`90rem`): they're page chrome, not dashboard content, so they stay full site width rather than
narrowing to the single-column results panel around them.

## Borders, radius & focus

Lumos's own token shape: `--border-width` (`0.0625rem`), `--radius-small` (`0.375rem`,
inputs/buttons/cards), `--radius-round` (`100vw`, the progress-bar track/fill),
`--focus-width`/`--focus-offset` for the `:focus-visible` ring.

## Components

Real Lumos components, wired in as-is (not reimplemented):

1. **`BaseHead`**: page `<head>` (title/description/canonical/OG/Twitter meta, favicon). Falls
   back to `/favicon.svg` for the social-share image since no dedicated OG image asset exists yet;
   replace `image` default once one ships.
2. **`SkipLink`**: Lumos's pattern exactly: renders a real `<Button element="link">`, fixed
   off-screen via `translate` until `:focus`, jumps to `#main`.
3. **`Nav`**: Lumos's full sticky-bar + mobile-toggle pattern, restyled. `nav_logo` renders the
   approved isotype alone (`src/assets/isotype.svg`, via `Icon`, no wordmark — `SITE_NAME` lives
   in the link's `aria-label` instead, so the accessible name is still the full product name),
   centered in a `min-height: var(--nav-height)` box, matching how Lumos sizes its own logo/toggle
   boxes. The JS-driven hamburger toggle (slide-open panel, `Escape` to close, closes on outside
   click, auto-closes above the 48rem breakpoint) is the real component, not a simplified
   stand-in: two links happened to fit inline before, but the toggle costs nothing to keep and
   now the nav scales if more links get added later.
4. **`Footer`**: same treatment: Lumos's structural pattern, isotype-only logo, real content
   (tagline, nav links, copyright) in place of Lumos's own scaffold links.
5. **`Section` / `Heading` / `Paragraph` / `ButtonWrapper` / `Button`**: used on both pages for
   the generic shell (hero section, form submit button, "Back to audit"/"Run another audit"
   links). `Button`'s real hover state swaps `background-color`/`color`/`border-color` via
   `--button-background-hover` etc. (not a `filter: brightness()`, that was the old hand-rolled
   button's approach, replaced now that it's the real component). The `link` variant (used for
   the two results-page CTAs) is deliberately thin with no minimum height; `.cta-link` in
   `results.astro` adds `min-height: 2.75rem` back on top without touching the shared component,
   since Button.astro serves every button on the site and shouldn't carry a page-specific fix.
6. **Primary input field**: still bespoke (no Lumos form-input component exists): `--background-2`
   fill, `--border-width` `--border` stroke, `--text`-colored focus ring/border on focus,
   `--text-faded` placeholder text.
7. **Score card**: still bespoke: `--background-2` background, 2px solid `--text` border, large
   centered score value, an uppercase label above it, and a progress bar beneath. No Lumos
   component fits a metric tile like this; `Card` is shaped for eyebrow/heading/text/button
   content, not a big number.
8. **Progress bar**: bespoke: pill-shaped track (`--border`, `--radius-round`), solid
   `--success`/`--error` fill sized to the score percentage, animated width transition.
9. **Category rows (accordion)**: bespoke: each is a real `<details>`/`<summary>` (open/close,
   keyboard support, and ARIA come from the browser, not custom JS), so every category, passing
   or failing, is clickable to reveal "What this checks," "Why it matters," a "What we found"
   list of the actual per-check facts (not just the rolled-up score: which specific bots are
   blocked, which structured-data types are missing, etc.), "How to fix it" (only when failing
   and a recommendation exists), and "Sources" (real, individually verified citation links). The
   chevron is a rotated CSS border, not an icon font or SVG. No Lumos component fits this shape.
10. **"Also checked" panel**: a second, dashed-border panel below the scored breakdown, using the
    same accordion row shape but for signals that are shown for context and never affect either
    score: llms.txt, the viewport meta tag, and a robots.txt `Content-Signal` directive. Each has
    its own specific reason for being unscored (see `src/lib/category-content.ts`); the panel
    exists specifically so it can never be mistaken for a hidden eighth scoring category.

Installed but not used on either page yet: `RichText`, `Eyebrow`, `Card`, `Img`, `Video`,
`Icon`, `Overlay`, `Grid`, `ContentWrapper`, `FormattedDate`. Nothing here is a content card, an
image, a video, rich markdown, or dated content; wire one in when a real need shows up, not
speculatively.

## Layout patterns

- **Landing page**: centered hero heading, wide input group below it. A digital clock and a
  static "Ready"/"Examining" status indicator are tucked into the top corners, decorative utility
  chrome, `aria-hidden`, with the real accessible status living in a separate `role="status"`
  element so a screen-reader user gets one clear announcement, not two competing ones.
- **Dashboard**: AEO/GEO score cards at the top, a one-line verdict beneath them, then the full
  "Lab results" panel as a high-contrast vertical list.

## Motion

Minimal by design, unchanged from the prior system. Progress-bar fill width transitions (`400ms
cubic-bezier(0.16, 1, 0.3, 1)`), `Button`'s own hover/active color transitions (200ms
background/text/border-color, per the real component now, not the old hand-rolled
`filter: brightness()`), `Nav`'s mobile-menu slide (`grid-template-rows` + `visibility`, 250ms)
and hamburger-to-X icon rotation, and smooth-scroll to the dashboard on submit (falls back to
instant under `prefers-reduced-motion`) are the only motion on the page.
`prefers-reduced-motion` also disables `scroll-behavior: smooth` (`global.css`) and collapses all
of the above transition durations to near-zero (`global.css`'s reduced-motion block). No entrance
choreography, no decorative animation.

## Accessibility

WCAG 2.1/2.2 AA minimum.

- **Contrast**: `--text` on `--background`/`--background-2` and `--text-faded` on the same clear
  4.5:1 at these values; verify against final rendered output before shipping regardless.
- **Never color-only**: every data-row status is icon (✓/!) **and** text ("Needs attention"),
  never the green/red tint alone.
- **Corner widgets** (clock, status) are `aria-hidden`: decorative chrome, not the accessible
  status channel. The real status lives in `#checkin-status` (`role="status"`).
- **Motion**: the only content-adjacent motion (scroll-to-dashboard) has a `prefers-reduced-motion`
  fallback to an instant jump.
- **The data rows are real text**, never canvas/image renderings: a screen reader must read
  every score, category, and recommendation exactly as a sighted user sees them.
- **Skip link**: `SkipLink.astro`, ported from Lumos's pattern, fixed off-screen until focus,
  jumps to `#main` (which carries `tabindex="-1"` so focus actually lands there, not just the
  scroll position).

## A note on Astro's scoped styles + JS-created elements

The data rows and progress-bar fills are created client-side (`results-ui.ts`). Astro's default
`<style>` scoping only tags elements present in the template at build time, so any selector
targeting a JS-created element (`.data-row`, `.data-row__*`, `.progress-bar__fill`) must use
Astro's `:global()`: confirmed as a real bug in an earlier version of this page (rows silently
rendered `display: block` instead of `flex` until fixed). Check this before assuming a new
scoped style will apply to anything rendered by `results-ui.ts`.

## Open items

- ~~Formal contrast-ratio verification of the final rendered output.~~ Done, in-browser, via
  canvas-composited contrast checks (not estimated from hex values); `--text-faded` originally
  measured 3.59–3.77:1 at 55%-in-`lab` and failed AA; now 5.68–6.14:1 at the current 70%-in-`srgb`
  value. Re-verify again if either swatch or `--text-faded`'s percentage changes.
- Whether the corner clock/status widgets earn their place long-term, or should be removed if
  they read as clutter rather than useful chrome once seen in a real browser.
- `Card`/`Grid`/`ContentWrapper`/`Img`/`Video`/`Overlay`/`Eyebrow`/`RichText`/`FormattedDate` are
  installed but unused; revisit whether they're worth keeping installed if that stays true for a
  long time, versus adding them only when a real page actually needs one.
- If a future page uses a `Section`/`Grid`/`Card` prop that generates a utility class name not
  yet in `patterns.css` (the full list lives in Lumos's `utilities.css`, not ported here), that's
  the likely cause of "the prop does nothing": add the specific class, not the whole file.
