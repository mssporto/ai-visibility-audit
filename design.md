# design.md — AI Visibility Audit

The concept: a visit to a doctor's clinic. You wait, you get checked, you're handed a note, then
the full lab results. Two visual registers, one shared system — vintage where the story earns
drama (waiting room, the reveal), modern where legibility matters (the actual report).

This document is the source of truth for every visual/interaction decision below. When
implementation begins, `src/styles/tokens.css` must encode these exact values — the two must
never drift; update both in the same change (per `CLAUDE.md`'s styling rule).

---

## 1. The three scenes

1. **Waiting room** (landing, vintage). Neon sign (in-world phrasing, e.g. "NOW EXAMINING" —
   final copy TBD), a themed check-in form for the URL (clipboard/intake styling), a numbered
   ticket, a wall clock. Nothing here is functional except the form and, optionally, the ticket
   (can show a session number/timestamp — decorative if not).
2. **The reveal** (vintage). Submitting flips a fluorescent lightbox on — an authentic irregular
   flicker sequence, not a clean fade — revealing a doctor's note lit against the glow: the two
   headline scores (AEO, GEO) and one short written verdict line. Nothing else on the note.
3. **The report** (modern). A lab-results sheet below the note: categories as rows, scores as
   values, a flag on anything below threshold — the natural surface for P0/P1 recommendations.

Copy approach throughout: the *scene* carries the theme. Labels on actual content (scores,
recommendations, category names) stay plain and scannable. Themed language is reserved for a
few deliberate moments (the sign, the verdict line) — not translated everywhere.

---

## 2. Color palette

Two families that share one accent, so the page reads as one system, not two designs stapled
together. Neither family uses pure `#000000`/`#FFFFFF` for any background or large fill.

### Vintage family (waiting room, lightbox, note)

| Token | Value | Use |
|---|---|---|
| `--vintage-bg` | `#0b0f14` | Waiting-room / lightbox background. Near-black, slightly blue, not pure black. |
| `--vintage-bg-raised` | `#12181f` | Elevated surfaces within the vintage scene (ticket, clock face background). |
| `--radiograph-glow` | `#bfe3ff` | The lightbox's bright glow — used for the note's illuminated edge/backlight only, not for body text (see accessibility, §7). |
| `--radiograph-accent` | `#3d8bff` | **The shared accent** — pulled from the glow, reused in the modern half for links, focus rings, and any UI accent. This is the one color both halves have in common. |
| `--note-paper` | `#f2ead9` | The doctor's note surface — warm cream, not stark white. |
| `--note-ink` | `#211c16` | Note text — near-black, warm-toned to match the paper. |

### Modern family (the lab-results report)

| Token | Value | Use |
|---|---|---|
| `--report-bg` | `#faf8f3` | Report section background — warm off-white, same family as the note paper so the two halves don't clash. |
| `--report-surface` | `#ffffff` — **not used for backgrounds**; see note below | — |
| `--report-ink` | `#14181c` | Primary report text. |
| `--report-ink-muted` | `#4a5157` | Secondary text (category descriptions, helper copy). |
| `--report-accent` | `--radiograph-accent` (`#3d8bff`) | Links, focus states, "pass" indicators — same value as the vintage accent. |
| `--report-flag` | `#c0392b` | **Only** for out-of-range flags (P0 recommendations) on the lab sheet — mirrors how real lab results mark abnormal values in red. Deliberately narrow-scoped: this color appears nowhere else on the page. |
| `--report-flag-bg` | `#fbeae7` | Faint background wash behind a flagged row — never the row's only differentiator (see §7, never color-only). |

> Card surfaces within the report (e.g. a row background) may use pure white in small amounts —
> "never pure white for backgrounds or large fills" governs the page background and major
> surfaces, not a thin card sitting on `--report-bg`. Default to `--report-bg` unless a surface
> genuinely needs to separate from it.

**Do not introduce a third arbitrary color.** Every new UI need should be met by shifting a tint
of one of the tokens above, not by picking a fresh hex value.

---

## 3. Typography

Two self-hosted faces, one per register — no CDN font loading, per the existing toolchain rule.

- **Vintage / typewriter — [Courier Prime](https://fonts.google.com/specimen/Courier+Prime)**
  (SIL OFL, freely embeddable). Used for: the neon sign's lettering, the check-in form's labels
  and input text, the ticket, the clock's numerals if any, and the entirety of the doctor's
  note. Chosen over a more distressed option like Special Elite because the note's two scores
  need to stay legible at a glance — the moment is dramatic via the *lightbox*, not via a
  hard-to-read face.
- **Modern / report — [IBM Plex Sans](https://fonts.google.com/specimen/IBM+Plex+Sans)**
  (SIL OFL). Used for all report-section body text, category names, recommendation text. Chosen
  specifically for its clinical/technical character — it already reads like something you'd see
  on a real lab or diagnostic instrument, which fits the "lab-results sheet" idea better than a
  more neutral choice like Inter would.

### Scale

Both faces use the same `clamp()`-based responsive scale (rem units, 8pt-grid-compatible line
heights), per the existing house rule:

| Token | `clamp()` | Line-height | Use |
|---|---|---|---|
| `--text-display` | `clamp(2rem, 1.4rem + 3vw, 3.5rem)` | 1.1 | Neon sign lettering, the note's two headline scores. |
| `--text-title` | `clamp(1.25rem, 1.1rem + 1vw, 1.75rem)` | 1.25 | Section headings (e.g. "Lab Results"). |
| `--text-body` | `1rem` (no scaling needed) | 1.6 | Report body copy, recommendation text. |
| `--text-small` | `0.875rem` | 1.5 | Category labels, helper/meta text, ticket/clock numerals. |

Tracking: the vintage typewriter face gets *no* added letter-spacing (it already has natural
monospace spacing); the modern sans gets the existing house tightening on large headings only
(~`-0.02em` at `--text-title` and above, none at body sizes).

---

## 4. Spacing & grid

Same house rule as every other project in this line: **8pt grid**, every spacing value a
multiple of `0.5rem`. `rem` for type/spacing, `clamp()` for responsive scaling, no fixed-px
breakpoint hacks.

| Token | Value |
|---|---|
| `--space-1` | `0.5rem` (8px) |
| `--space-2` | `1rem` (16px) |
| `--space-3` | `1.5rem` (24px) |
| `--space-4` | `2rem` (32px) |
| `--space-6` | `3rem` (48px) |
| `--space-8` | `4rem` (64px) |

Max content width for the report section: `48rem`, centered — narrow enough to keep lab-sheet
rows scannable, matching how real lab results are laid out in a single readable column.

---

## 5. Roundness

Radius is deliberately different per register, because the *objects* are different:

| Token | Value | Use |
|---|---|---|
| `--radius-paper` | `2px` | The note, the ticket, the check-in clipboard — real paper/cardstock has sharp corners, at most a hint of worn softness. Never more than 2px here; a rounded note reads as a UI card, not paper. |
| `--radius-ui` | `10px` | Modern report cards, the lab-sheet's row containers, inputs, buttons. Standard soft modern UI rounding. |
| `--radius-pill` | `999px` | Any pill-shaped element (e.g. a status badge on a lab row). |

---

## 6. Buttons

Two distinct treatments, matching each scene's register. Every interactive element gets hover,
focus-visible, and active states — no exceptions, per house rule. Animate only `transform` and
`opacity`; never `transition-all`; respect `prefers-reduced-motion`.

### Vintage — the check-in form's submit button
- Shape: `--radius-paper` (sharp, like a stamped form button), Courier Prime label, uppercase,
  letter-spacing preserved as typed.
- Rest: `--vintage-bg-raised` fill, `--note-paper` text, 1px `--note-paper` border at 40% opacity.
- Hover: background lightens toward `--radiograph-glow` at 12% opacity overlay; `transform:
  translateY(-1px)`.
- Focus-visible: 2px solid `--radiograph-accent` outline, 2px offset.
- Active: `transform: translateY(0)`, background returns toward rest.
- Disabled (while an audit is running): 50% opacity, `cursor: not-allowed`, label changes to
  "Examining…" (in-world, per the light-touch copy rule).

### Modern — report-section buttons (e.g. "Copy link," "Run another audit")
- Shape: `--radius-ui`, IBM Plex Sans, sentence case.
- Rest: `--report-accent` fill, white text (text-on-solid-accent is the one legitimate use of
  pure white — it's a glyph color, not a background fill).
- Hover: background darkens ~8%, `transform: translateY(-1px)`.
- Focus-visible: 2px solid `--report-accent` outline, 2px offset, offset color `--report-bg`.
- Active: `transform: translateY(0)`.
- Secondary/outline variant: transparent fill, 1.5px `--report-accent` border, `--report-accent`
  text — used for the less-important of two adjacent actions.

---

## 7. Motion

- **The lightbox flicker-on** is the one deliberate "flashy moment" this design gets (per the
  house rule of exactly one). Sequence, matching how a real fluorescent tube actually ignites —
  irregular, not a clean fade:
  1. `0ms`: brightness 0.
  2. `40ms`: brief flash to ~60% brightness, `80ms`: drop to ~15%.
  3. `140ms`: flash to ~80%, `190ms`: drop to ~30%.
  4. `260ms`: flash to ~95%, `310ms`: settle to 100%, steady.
  5. Implemented as a CSS `@keyframes` animating `opacity`/`filter: brightness()` only — no
     layout-affecting properties, so it stays cheap and composited.
  - **`prefers-reduced-motion: reduce`**: skip straight to the final "on" state, no keyframes at
    all. The note must be immediately fully visible — the flicker is atmosphere, never a gate to
    content.
- **Neon sign**: a slow, subtle buzz/flicker loop (real neon signs aren't perfectly steady) —
  small, infrequent brightness variation (±5%, every few seconds, irregular timing), never a
  regular pulse (regular pulsing reads as a loading spinner, not neon). Disabled entirely under
  `prefers-reduced-motion`.
- **Everything else** (button states, hover, focus): `transform`/`opacity` only, standard
  150–200ms ease, per house rule.

---

## 8. Layout notes per component

- **Neon sign**: rendered as styled text (real text, not an image) with a CSS `text-shadow`
  glow stack in `--radiograph-glow`/`--radiograph-accent`, so it stays selectable/accessible and
  crisp at any zoom level — never a rasterized image standing in for text.
- **Check-in form**: the URL input styled like a clipboard field — a single input with a
  typewriter-style label above it (e.g. "URL"), sharp `--radius-paper` corners, a subtle
  drop-shadow suggesting a clipboard's slight lift off the wall.
- **Ticket**: a small stub near the form, `--radius-paper`, perforated-edge effect achieved with
  a repeating-gradient or dashed-border trick (CSS only, no image asset). If made functional,
  shows a session number or timestamp — decorative is an acceptable fallback if a functional
  number requires state we don't want to add (see `CLAUDE.md`'s "no persistent state" rule —
  a client-only, non-persisted per-session number is fine; nothing gets stored server-side).
- **Wall clock**: a simple CSS-drawn analog face (no image asset) — purely atmospheric, marked
  `aria-hidden="true"` since it carries no information.
- **The note**: centered, max-width matched to a realistic note size (not full-bleed), sitting
  on `--note-paper` with a soft `--radiograph-glow` backlight (a large, blurred box-shadow behind
  the note, not applied to the text itself — see accessibility below).
- **Lab-results sheet**: each category is a row — name, score, a subtle bar/value indicator, and
  a flag icon + `--report-flag` tint when below threshold. Recommendations render as an
  expandable detail under their related flagged row, not a separate disconnected list, so the
  "diagnosis → treatment" relationship stays visually obvious.

---

## 9. Accessibility

WCAG 2.1/2.2 **AA minimum**, per house rule — applies to every scene, including the vintage half.

- **Contrast**: `--note-ink` on `--note-paper` and `--report-ink` on `--report-bg` must both
  independently clear 4.5:1 (verify with the final exact hex values at build time — the values
  above are a strong starting point, not yet contrast-checked against every possible pairing).
  The `--radiograph-glow` backlight is a decorative `box-shadow`/blur effect **behind** the note,
  never the actual text color — text contrast must never depend on the glow being visible.
- **Never color-only**: the lab sheet's flag uses an icon *and* text label ("Needs attention") in
  addition to the `--report-flag` tint — never red-tint alone as the only signal.
- **Motion**: every animation in §7 has a defined `prefers-reduced-motion` fallback; none of them
  gate access to content (the flicker never delays the note's content from being in the DOM and
  readable by a screen reader immediately, only its *visual* reveal is delayed for sighted
  users without the reduced-motion preference).
- **Decorative elements** (neon sign's glow layer, ticket's perforation effect, the wall clock)
  get `aria-hidden="true"` or empty `alt`; they carry zero information a screen reader user needs.
- **Keyboard/focus**: full keyboard navigation, visible focus states on every interactive element
  (§6), a skip-to-main link, semantic landmarks (`<main>`, `<form>`, heading hierarchy) — the
  themed scene must never replace real semantic structure with purely visual div soup.
- **The doctor's note and lab sheet are real text**, not canvas or image renderings — a screen
  reader must be able to read the scores, verdict line, and every category/recommendation
  exactly as a sighted user sees them.

---

## 10. Responsive behavior

No fixed-px breakpoints; layout responds via `clamp()` and flex/grid reflow. Specific to this
design's atmosphere pieces:

- Below roughly `480px` viewport width, the ticket and wall clock — being purely decorative —
  may be hidden (`display: none`) to keep the waiting-room scene from feeling cluttered on a
  small screen. The neon sign and check-in form are never hidden; they're the functional core.
- The note and lab sheet both go full-width (within the `--space-3` page margin) below `768px`,
  same single-column layout as desktop just narrower — no separate mobile-only layout needed
  since both are already single-column by design.

---

## 11. Open items for the visual pass

These are deliberately left for when implementation starts, not blocking this spec:

- Final neon-sign copy (candidates: "NOW EXAMINING", "WALK-INS WELCOME").
- Exact verdict-line copy pattern for the note (e.g. "Diagnosis: mostly discoverable, with some
  visibility gaps") — needs a few real examples run through the actual scoring engine to see
  what reads naturally across a range of scores, not just one hand-picked example.
- Formal contrast-ratio verification of every exact color pairing once implemented (§9).
- Whether the ticket becomes genuinely functional (session number) or stays decorative-only.
