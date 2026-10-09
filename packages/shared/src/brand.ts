/**
 * Modulr brand tokens (spec §3). These values are final; apps derive their
 * Tailwind / React Native themes from here rather than hard-coding hex values.
 */
export const colors = {
  cobalt: "#2343FF",
  periwinkle: "#5C73FF",
  sunflower: "#FFC629",
  ink: "#111018",
  cream: "#FFF4E2",
  orange: "#FF5B1F",
  mint: "#1FD49E",
  pink: "#FF5FA2",
  red: "#FF2E4D",
  white: "#FFFFFF",
} as const;

export type BrandColor = keyof typeof colors;

/** Semantic roles mapped onto brand colours. */
export const semantic = {
  primary: colors.cobalt,
  secondary: colors.periwinkle,
  highlight: colors.sunflower,
  success: colors.mint,
  danger: colors.red,
  warning: colors.orange,
  text: colors.ink,
  surfaceWarm: colors.cream,
} as const;

/** Callout block styling for notes (`:::trick`, `:::tip`, `:::mistake`, `:::definition`). */
export const calloutColors = {
  trick: colors.sunflower,
  tip: colors.cobalt,
  mistake: colors.red,
  definition: colors.periwinkle,
} as const;

export const fonts = {
  display: { family: "Unbounded", weights: [700, 800, 900], letterSpacing: "-0.03em" },
  body: { family: "Manrope", weights: [500, 600, 700, 800] },
  mono: { family: "JetBrains Mono", weights: [600] },
} as const;

/** Minimum readable body size on study screens (spec §3, §6). */
export const MIN_BODY_FONT_PX = 16;
