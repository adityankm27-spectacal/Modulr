import { describe, expect, it } from "vitest";
import { formatDuration, formatInterval, formatPrice, plainPreview, pluralize } from "./format";

describe("formatPrice", () => {
  it("formats paise as rupees", () => {
    expect(formatPrice(4900)).toBe("₹49");
    expect(formatPrice(14950)).toBe("₹149.50");
    expect(formatPrice(149900)).toBe("₹1,499");
  });
});

describe("formatInterval", () => {
  it("describes plan intervals", () => {
    expect(formatInterval("month", null)).toBe("per month");
    expect(formatInterval("one_time", 90)).toBe("one-time, valid 90 days");
    expect(formatInterval("one_time", null)).toBe("one-time");
  });
});

describe("formatDuration", () => {
  it.each([
    [null, null],
    [40, "1 min"],
    [545, "9 min"],
    [3600, "1 h"],
    [3725, "1 h 2 min"],
  ])("%s seconds → %s", (input, expected) => {
    expect(formatDuration(input)).toBe(expected);
  });
});

describe("pluralize", () => {
  it("handles singular and plural", () => {
    expect(pluralize(1, "module")).toBe("1 module");
    expect(pluralize(3, "module")).toBe("3 modules");
    expect(pluralize(0, "PYQ", "PYQs")).toBe("0 PYQs");
  });
});

describe("plainPreview", () => {
  it("strips markdown, callouts and display maths", () => {
    const md = "# Title\n\n:::tip\n**Bold** tip with $x^2$\n:::\n\n$$\n\\frac{a}{b}\n$$";
    expect(plainPreview(md)).toBe("Title Bold tip with x^2 [formula]");
  });

  it("drops LaTeX spacing commands", () => {
    expect(plainPreview("evaluate $\\int_0^1 x\\,dx$.")).toBe("evaluate 0^1 x dx.");
  });

  it("truncates long text", () => {
    expect(plainPreview("word ".repeat(100), 20)).toHaveLength(20);
  });
});
