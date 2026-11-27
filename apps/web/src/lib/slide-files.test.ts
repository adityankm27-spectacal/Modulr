import { describe, expect, it } from "vitest";
import {
  formatFileSize,
  SLIDE_MAX_BYTES,
  SLIDE_PATH_PATTERN,
  slideExtension,
  slideFileProblem,
  slideTitleFromFileName,
} from "./slide-files";

const uuid = "d37fb0b1-f0c1-4a06-bfa9-6e6580252c2c";

describe("slideExtension", () => {
  it("accepts decks, PDFs and Word files by name", () => {
    expect(slideExtension("Unit 2.PPTX")).toBe("pptx");
    expect(slideExtension("old.ppt")).toBe("ppt");
    expect(slideExtension("notes.pdf")).toBe("pdf");
    expect(slideExtension("a.b.docx")).toBe("docx");
    expect(slideExtension("x.doc")).toBe("doc");
  });

  it("rejects anything else", () => {
    expect(slideExtension("deck.key")).toBeNull();
    expect(slideExtension("pptx")).toBeNull();
    expect(slideExtension("image.png")).toBeNull();
  });
});

describe("slideFileProblem", () => {
  it("checks type and size", () => {
    expect(slideFileProblem({ name: "a.pptx", size: 1000 })).toBeNull();
    expect(slideFileProblem({ name: "a.zip", size: 1000 })).toMatch(/Choose/);
    expect(slideFileProblem({ name: "a.pdf", size: 0 })).toMatch(/empty/);
    expect(slideFileProblem({ name: "a.pdf", size: SLIDE_MAX_BYTES + 1 })).toMatch(/50 MB/);
  });
});

describe("SLIDE_PATH_PATTERN", () => {
  it("only matches <module>/<uuid>.<allowed ext>", () => {
    expect(SLIDE_PATH_PATTERN.test(`${uuid}/${uuid}.pptx`)).toBe(true);
    expect(SLIDE_PATH_PATTERN.test(`${uuid}/${uuid}.exe`)).toBe(false);
    expect(SLIDE_PATH_PATTERN.test(`../${uuid}/${uuid}.pdf`)).toBe(false);
  });
});

describe("helpers", () => {
  it("derives a title and formats sizes", () => {
    expect(slideTitleFromFileName("Unit_2_ER_Model.pptx")).toBe("Unit 2 ER Model");
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2 MB");
    expect(formatFileSize(1536 * 1024)).toBe("1.5 MB");
    expect(formatFileSize(300)).toBe("1 KB");
    expect(formatFileSize(null)).toBeNull();
  });
});
