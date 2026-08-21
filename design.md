# design.md — AI Visibility Audit

## Modern Utility Design System

A minimalist, high-utility design system focused on extreme readability, accessibility, and
functional clarity — for a diagnostic tool where performance and clarity matter more than
atmosphere. This replaces an earlier "clinic visit" skeuomorphic concept, which was tried, built,
and explicitly rejected; see the git history on this branch for that attempt. Do not resurrect
either the clinic metaphor or a dark-background-plus-glow scheme without a fresh, explicit
decision to do so.

`src/styles/tokens.css` must encode these exact values — the two must never drift; update both
in the same change.

## Core principles

- **Clarity over decoration.** Every element serves a functional purpose. No non-essential
  textures, shadows, or gradients.
- **High contrast.** A strict color palette for peak legibility and accessibility compliance.
- **Intentional whitespace.** Generous margins/padding for a focused, low-cognitive-load
  experience.
- **Structured hierarchy.** Data organized in clean rows with clear labels and status indicators.

## Color palette

| Token | Value | Use |
|---|---|---|
| `--bg` | `#f4f4f4` | Page background. |
| `--surface` | `#ffffff` | Cards and containers. |
| `--ink` | `#000000` | Headings, primary text, the action button's fill. |
| `--ink-secondary` | `#666666` | Labels, secondary/meta text. |
| `--success` | `#10b981` | "Pass" states, positive progress-bar fill. |
| `--error` | `#ef4444` | "Fail" states, critical alerts. |
| `--border` | `#d1d5db` | Dividers, input strokes, progress-bar track. |

**Deliberate, explicit exception to this project's general "never pure `#000000`/`#FFFFFF`"
house rule** (see `CLAUDE.md`): this design system calls for literal pure black/white by name,
and that instruction was given explicitly and directly, not defaulted into. The house rule still
applies to any *future* design work on this or other projects unless similarly overridden on
purpose.

## Typography

- **Font**: Inter (self-hosted via `@fontsource/inter`, weights 400/500/600/700/800) — a modern
  geometric sans, per the spec's own naming (Inter/SF Pro/Roboto were the named options; Inter
  was picked as the actual self-hostable choice).
- **Headings**: bold/extra-bold, tight letter-spacing (`-0.02em` on the display heading).
- **Body**: regular weight, generous line-height (1.6) for readability.
- **Scores**: extra-bold/heavy weight, large size — the numerical values are the page's most
  important content and must stand out immediately.

| Token | `clamp()` | Use |
|---|---|---|
| `--text-display` | `clamp(2.25rem, 1.6rem + 3vw, 4rem)` | The landing hero heading. |
| `--text-title` | `clamp(1.25rem, 1.1rem + 0.8vw, 1.75rem)` | Section headings ("Lab results"). |
| `--text-score` | `clamp(2.5rem, 2rem + 2vw, 3.5rem)` | The AEO/GEO score-card values. |
| `--text-body` | `1rem` | Body copy. |
| `--text-small` | `0.875rem` | Labels, data-row values. |
| `--text-micro` | `0.75rem` | Corner-widget text. |

## Spacing & grid

8px-based spacing system (`--space-1` = `0.5rem` through `--space-12` = `6rem`), `rem` units,
`clamp()` for responsive scaling. Landing page: centered single-column. Dashboard: a
`repeat(auto-fit, minmax(200px, 1fr))` score-card row, then a single-column results panel
(`--dashboard-max-width: 48rem`).

## Roundness

`--radius: 2px` — minimal to zero, per the utility look. `--radius-pill` (`999px`) only for the
progress-bar track/fill.

## Components

1. **Primary input field** — large rectangular field, 1px `--border` stroke, black focus
   ring/border on focus (`box-shadow: 0 0 0 1px var(--ink)`), `--ink-secondary` placeholder text.
2. **Action button** — solid `--ink` fill, `--surface` bold text, `--radius`. Hover brightens
   (`filter: brightness(1.3)`), active dims slightly, disabled drops to 50% opacity.
3. **Score card** — `--surface` background, 2px solid `--ink` border, large centered score value,
   an uppercase label above it, and a progress bar beneath.
4. **Progress bar** — pill-shaped track (`--border`), solid `--success`/`--error` fill sized to
   the score percentage, animated width transition on update.
5. **Data rows** — horizontal flex, a status icon (✓ green / ! red) plus category label on the
   left, score + "Needs attention" text on the right; 1px `--border` dividers between rows.
   A flagged row's recommendations render as an indented detail directly beneath it.

## Layout patterns

- **Landing page**: centered hero heading, wide input group below it. A digital clock and a
  static "Ready"/"Examining" status indicator are tucked into the top corners — decorative utility
  chrome, `aria-hidden`, with the real accessible status living in a separate `role="status"`
  element so a screen-reader user gets one clear announcement, not two competing ones.
- **Dashboard**: AEO/GEO score cards at the top, a one-line verdict beneath them, then the full
  "Lab results" panel as a high-contrast vertical list.

## Motion

Minimal by design — this register calls for clarity, not choreography. Progress-bar fill width
transitions (`400ms cubic-bezier(0.16, 1, 0.3, 1)`), button hover/active `filter` changes, and
smooth-scroll to the dashboard on submit (falls back to instant under `prefers-reduced-motion`)
are the only motion on the page. No entrance choreography, no decorative animation.

## Accessibility

WCAG 2.1/2.2 AA minimum.

- **Contrast**: `--ink` on `--bg`/`--surface` and `--ink-secondary` on `--bg`/`--surface` both
  clear 4.5:1 easily at these exact values (`#666666` on `#F4F4F4` and `#FFFFFF` — verify against
  final rendered output before shipping regardless).
- **Never color-only**: every data-row status is icon (✓/!) **and** text ("Needs attention"),
  never the green/red tint alone.
- **Corner widgets** (clock, status) are `aria-hidden` — decorative chrome, not the accessible
  status channel. The real status lives in `#checkin-status` (`role="status"`).
- **Motion**: the only content-adjacent motion (scroll-to-dashboard) has a `prefers-reduced-motion`
  fallback to an instant jump.
- **The data rows are real text**, never canvas/image renderings — a screen reader must read
  every score, category, and recommendation exactly as a sighted user sees them.

## A note on Astro's scoped styles + JS-created elements

The data rows and progress-bar fills are created client-side (`audit-ui.ts`). Astro's default
`<style>` scoping only tags elements present in the template at build time, so any selector
targeting a JS-created element (`.data-row`, `.data-row__*`, `.progress-bar__fill`) must use
Astro's `:global()` — confirmed as a real bug in an earlier version of this page (rows silently
rendered `display: block` instead of `flex` until fixed). Check this before assuming a new
scoped style will apply to anything rendered by `audit-ui.ts`.

## Open items

- Formal contrast-ratio verification of the final rendered output.
- Whether the corner clock/status widgets earn their place long-term, or should be removed if
  they read as clutter rather than useful chrome once seen in a real browser.
