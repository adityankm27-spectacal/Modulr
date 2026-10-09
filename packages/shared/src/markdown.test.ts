import { describe, expect, it } from "vitest";
import { splitCallouts } from "./markdown";

describe("splitCallouts", () => {
  it("returns a single markdown segment when there are no callouts", () => {
    expect(splitCallouts("# Title\n\nText")).toEqual([
      { type: "markdown", content: "# Title\n\nText" },
    ]);
    expect(splitCallouts("")).toEqual([]);
  });

  it("extracts each callout kind between markdown", () => {
    const md = "Intro\n:::trick\nRemember **this**\n:::\nMiddle\n:::definition\nTerm\n:::\nEnd";
    expect(splitCallouts(md)).toEqual([
      { type: "markdown", content: "Intro" },
      { type: "callout", kind: "trick", content: "Remember **this**" },
      { type: "markdown", content: "Middle" },
      { type: "callout", kind: "definition", content: "Term" },
      { type: "markdown", content: "End" },
    ]);
  });

  it.each(["trick", "tip", "mistake", "definition"] as const)("recognises :::%s", (kind) => {
    expect(splitCallouts(`:::${kind}\nbody\n:::`)).toEqual([
      { type: "callout", kind, content: "body" },
    ]);
  });

  it("is case-insensitive and tolerates spacing and CRLF", () => {
    expect(splitCallouts("::: TIP \r\nbody\r\n:::  \r\n")).toEqual([
      { type: "callout", kind: "tip", content: "body" },
    ]);
  });

  it("keeps multi-line maths and lists inside a callout", () => {
    const md = ":::tip\n$$\nx = 1\n$$\n\n- a\n- b\n:::";
    expect(splitCallouts(md)).toEqual([
      { type: "callout", kind: "tip", content: "$$\nx = 1\n$$\n\n- a\n- b" },
    ]);
  });

  it("ignores callout markers inside code fences", () => {
    const md = "```\n:::tip\nnot a callout\n:::\n```";
    expect(splitCallouts(md)).toEqual([{ type: "markdown", content: md }]);

    const inside = ":::tip\n```\n:::\n```\nstill inside\n:::";
    expect(splitCallouts(inside)).toEqual([
      { type: "callout", kind: "tip", content: "```\n:::\n```\nstill inside" },
    ]);
  });

  it("treats an unclosed callout as running to the end", () => {
    expect(splitCallouts("a\n:::mistake\nwatch out")).toEqual([
      { type: "markdown", content: "a" },
      { type: "callout", kind: "mistake", content: "watch out" },
    ]);
  });

  it("does not nest callouts", () => {
    expect(splitCallouts(":::tip\n:::trick\ninner\n:::\nafter")).toEqual([
      { type: "callout", kind: "tip", content: ":::trick\ninner" },
      { type: "markdown", content: "after" },
    ]);
  });

  it("leaves unknown kinds as plain text", () => {
    const md = ":::note\nbody\n:::";
    expect(splitCallouts(md)).toEqual([{ type: "markdown", content: md }]);
  });
});
