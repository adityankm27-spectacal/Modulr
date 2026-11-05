/**
 * Markdown images need a description (alt text) so screen readers can say what they
 * show. `![](diagram.png)` has none; `![Queue with front and rear pointers](diagram.png)` does.
 */
const IMAGE_WITHOUT_ALT = /!\[\s*\]\(/g;

export const IMAGE_ALT_MESSAGE =
  "Describe every image for screen readers: write ![what the image shows](link) instead of ![](link).";

export function countImagesWithoutAlt(markdown: string): number {
  return markdown.match(IMAGE_WITHOUT_ALT)?.length ?? 0;
}

export const hasImageAlts = (markdown: string) => countImagesWithoutAlt(markdown) === 0;
