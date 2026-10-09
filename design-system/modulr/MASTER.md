# Modulr design system (master)

Source of truth for every UI milestone. Page-specific overrides go in `pages/<page>.md`.
Brand values come from spec §3 and are **final**. The `ui-ux-pro-max` skill
(`.claude/skills/ui-ux-pro-max`) is used for UX, accessibility and layout rules only;
its generated palettes and font pairings do not apply to Modulr.

## Tokens

Defined once in `packages/shared/src/brand.ts`, mirrored as Tailwind theme tokens in
`apps/web/src/app/globals.css`. Components use semantic tokens (`bg-surface`, `text-fg`,
`bg-primary`), never raw hex.

| Token      | Hex       | Role                                |
| ---------- | --------- | ----------------------------------- |
| cobalt     | `#2343FF` | Primary: buttons, links, focus ring |
| periwinkle | `#5C73FF` | Secondary; primary in dark mode     |
| sunflower  | `#FFC629` | Highlights, `:::trick` callouts     |
| ink        | `#111018` | Text; dark surface                  |
| cream      | `#FFF4E2` | Warm raised surface                 |
| orange     | `#FF5B1F` | Promo accent, non-error alerts      |
| mint       | `#1FD49E` | Success, done, free-preview badge   |
| pink       | `#FF5FA2` | Marketing accent only               |
| red        | `#FF2E4D` | Errors, attendance below 75%        |

Callouts: trick = sunflower, tip = cobalt, mistake = red, definition = periwinkle.

## Type

- Display: Unbounded 700–900, letter-spacing −0.03em, line-height ~1.1
- Body/UI: Manrope 500–800, **16 px minimum**, line-height 1.5–1.6
- Formulas, code, table numbers: JetBrains Mono 600

## Two moods

- **Marketing** (landing, pricing): big type, colour blocks, playful motion.
- **Study** (module, notes, questions): calm light surface, generous spacing, no decorative motion.

## Rules (from ui-ux-pro-max, priority order)

1. **Accessibility:** contrast ≥ 4.5:1 (sunflower/mint/orange are fill colours, never text on white);
   visible focus rings; labels on icon-only buttons; captions on videos.
2. **Touch:** targets ≥ 44×44 px with ≥ 8 px gaps; loading feedback on every async action.
3. **Performance:** module page interactive < 2.5 s on mid-range Android/4G; reserve media space (no CLS);
   lazy-load below-the-fold.
4. **Style:** SVG icons only (Lucide), **no emoji** anywhere in the UI.
5. **Layout:** design at **360 px first**, then 768 / 1024 / 1440; no horizontal scroll; never disable zoom.
6. **Colour:** semantic tokens only; dark mode via `prefers-color-scheme` + `data-theme` override.
7. **Motion:** 150–300 ms, transform/opacity only, respect `prefers-reduced-motion`.
8. **Forms:** visible labels, errors next to the field, OTP inputs with numeric keyboard.
9. **Navigation:** bottom nav ≤ 5 items on mobile; predictable back; deep links for module/tab.

## Pre-delivery checklist

- [ ] No emoji; icons are SVG with accessible names or `aria-hidden`
- [ ] Clickable elements have hover/pressed states and `cursor-pointer`
- [ ] Contrast checked in light **and** dark mode
- [ ] Keyboard focus visible and in logical order
- [ ] Reduced motion respected
- [ ] Checked at 360, 768, 1024, 1440 px
