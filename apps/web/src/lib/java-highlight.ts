/**
 * A small Java tokenizer for the Code tab: enough to colour keywords, types, strings,
 * comments, numbers and annotations, without a syntax-highlighting dependency. Output
 * is plain text split into typed pieces per line, rendered as React text (never HTML).
 */

export type TokenType =
  "keyword" | "type" | "string" | "comment" | "number" | "annotation" | "plain";

export interface Token {
  type: TokenType;
  text: string;
}

const KEYWORDS = new Set(
  (
    "abstract assert boolean break byte case catch char class const continue default do " +
    "double else enum extends final finally float for goto if implements import instanceof " +
    "int interface long native new package private protected public return short static " +
    "strictfp super switch synchronized this throw throws transient try void volatile while " +
    "var record yield sealed permits non-sealed true false null"
  ).split(" "),
);

// Order matters: comments and strings first, so keywords inside them aren't coloured.
const PATTERN = new RegExp(
  [
    String.raw`(?<comment>\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))`,
    String.raw`(?<string>"""[\s\S]*?(?:"""|$)|"(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?)`,
    String.raw`(?<annotation>@[A-Za-z_]\w*)`,
    String.raw`(?<number>\b(?:0[xX][\da-fA-F_]+|0[bB][01_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)[lLfFdD]?\b)`,
    String.raw`(?<word>[A-Za-z_$][\w$]*)`,
  ].join("|"),
  "g",
);

/** Splits Java source into lines of coloured tokens. Never drops or changes characters. */
export function highlightJava(code: string): Token[][] {
  const tokens: Token[] = [];
  let last = 0;
  for (const match of code.matchAll(PATTERN)) {
    const start = match.index ?? 0;
    if (start > last) tokens.push({ type: "plain", text: code.slice(last, start) });
    const groups = match.groups ?? {};
    const text = match[0];
    let type: TokenType = "plain";
    if (groups.comment) type = "comment";
    else if (groups.string) type = "string";
    else if (groups.annotation) type = "annotation";
    else if (groups.number) type = "number";
    else if (groups.word) {
      type = KEYWORDS.has(text) ? "keyword" : /^[A-Z]/.test(text) ? "type" : "plain";
    }
    tokens.push({ type, text });
    last = start + text.length;
  }
  if (last < code.length) tokens.push({ type: "plain", text: code.slice(last) });

  // Break tokens at newlines so each line can be numbered (block comments span lines).
  const lines: Token[][] = [];
  let line: Token[] = [];
  for (const token of tokens) {
    token.text.split("\n").forEach((part, i) => {
      if (i > 0) {
        lines.push(line);
        line = [];
      }
      if (part) line.push({ type: token.type, text: part });
    });
  }
  lines.push(line);
  return lines;
}
