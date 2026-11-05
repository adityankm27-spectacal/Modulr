import { describe, expect, it } from "vitest";
import { countImagesWithoutAlt, hasImageAlts } from "./markdown-images";

describe("markdown image descriptions", () => {
  it("flags images with an empty or blank description", () => {
    expect(countImagesWithoutAlt("![](a.png) and ![  ](b.png)")).toBe(2);
    expect(hasImageAlts("Intro\n\n![](a.png)")).toBe(false);
  });

  it("accepts described images, links and plain text", () => {
    expect(hasImageAlts("![Queue diagram](a.png)")).toBe(true);
    expect(hasImageAlts("[a link](https://example.com) and [](empty-link)")).toBe(true);
    expect(hasImageAlts("No images here!")).toBe(true);
  });
});
