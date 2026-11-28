import { describe, expect, it } from "vitest";
import { highlightJava, type Token } from "./java-highlight";

const join = (lines: Token[][]) => lines.map((l) => l.map((t) => t.text).join("")).join("\n");
const typesOf = (lines: Token[][], type: Token["type"]) =>
  lines
    .flat()
    .filter((t) => t.type === type)
    .map((t) => t.text);

describe("highlightJava", () => {
  const code = [
    "@Override",
    "public static void main(String[] args) { // entry",
    '    int top = -1; String s = "if (x) return";',
    "    /* multi",
    "       line */ char c = 'a';",
    "    double d = 3.5e2;",
    "}",
  ].join("\n");
  const lines = highlightJava(code);

  it("keeps every character and line", () => {
    expect(join(lines)).toBe(code);
    expect(lines).toHaveLength(7);
  });

  it("colours keywords, types, strings, numbers and annotations", () => {
    expect(typesOf(lines, "keyword")).toEqual(
      expect.arrayContaining(["public", "static", "void", "int", "char", "double"]),
    );
    expect(typesOf(lines, "type")).toEqual(expect.arrayContaining(["String"]));
    expect(typesOf(lines, "string")).toEqual(['"if (x) return"', "'a'"]);
    expect(typesOf(lines, "number")).toEqual(["1", "3.5e2"]);
    expect(typesOf(lines, "annotation")).toEqual(["@Override"]);
  });

  it("doesn't colour keywords inside strings or comments", () => {
    expect(typesOf(lines, "keyword")).not.toContain("if");
    expect(typesOf(lines, "keyword")).not.toContain("return");
  });

  it("splits a block comment across its lines", () => {
    expect(lines[3]?.at(-1)).toEqual({ type: "comment", text: "/* multi" });
    expect(lines[4]?.[0]).toEqual({ type: "comment", text: "       line */" });
  });

  it("handles empty code and an unterminated string", () => {
    expect(highlightJava("")).toEqual([[]]);
    expect(join(highlightJava('String s = "oops'))).toBe('String s = "oops');
  });
});
