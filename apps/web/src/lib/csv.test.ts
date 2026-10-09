import { describe, expect, it } from "vitest";
import { CsvError, parseCsv } from "./csv";

const cells = (text: string) => parseCsv(text).map((r) => r.cells);

describe("parseCsv", () => {
  it("parses simple rows", () => {
    expect(cells("a,b,c\n1,2,3\n")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles quotes, escaped quotes, commas and newlines inside quotes", () => {
    expect(cells('q,a\n"x, y","say ""hi""\nline 2"')).toEqual([
      ["q", "a"],
      ["x, y", 'say "hi"\nline 2'],
    ]);
  });

  it("handles CRLF, a BOM, empty cells and blank lines", () => {
    expect(cells("\uFEFFa,b\r\n\r\n1,\r\n,2")).toEqual([
      ["a", "b"],
      ["1", ""],
      ["", "2"],
    ]);
  });

  it("reports the starting line of each row", () => {
    expect(parseCsv('h\n"multi\nline"\nnext').map((r) => r.line)).toEqual([1, 2, 4]);
  });

  it("throws on an unclosed quote", () => {
    expect(() => parseCsv('a\n"oops')).toThrow(CsvError);
    expect(() => parseCsv('a\n"oops')).toThrow("Line 2");
  });
});
