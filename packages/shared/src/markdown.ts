/**
 * Splits authored Markdown into plain-Markdown and callout segments (spec §4):
 *
 *   :::trick        Memory trick
 *   :::tip          Exam tip
 *   :::mistake      Common mistake
 *   :::definition   Definition
 *   ...content...
 *   :::
 *
 * Kept free of any renderer so the web app, the admin live preview and the
 * Android app all agree on what a callout is. Lenient on purpose: an unclosed
 * callout runs to the end of the document (friendly while typing in the editor),
 * and `:::` lines inside code fences are left alone.
 */
import { CALLOUT_KINDS, type CalloutKind } from "./enums";

export type MarkdownSegment =
  { type: "markdown"; content: string } | { type: "callout"; kind: CalloutKind; content: string };

export const CALLOUT_LABELS: Record<CalloutKind, string> = {
  trick: "Memory trick",
  tip: "Exam tip",
  mistake: "Common mistake",
  definition: "Definition",
};

const OPEN = new RegExp(`^\\s{0,3}:::\\s*(${CALLOUT_KINDS.join("|")})\\s*$`, "i");
const CLOSE = /^\s{0,3}:::\s*$/;
const FENCE = /^\s{0,3}(`{3,}|~{3,})/;

export function splitCallouts(source: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = [];
  let buffer: string[] = [];
  let current: CalloutKind | null = null;
  let fence: string | null = null;

  const flush = () => {
    const content = buffer.join("\n");
    buffer = [];
    if (current) {
      segments.push({ type: "callout", kind: current, content: content.trim() });
    } else if (content.trim()) {
      segments.push({ type: "markdown", content });
    }
  };

  for (const line of source.replace(/\r\n?/g, "\n").split("\n")) {
    const fenceMatch = FENCE.exec(line);
    if (fenceMatch) {
      const marker = fenceMatch[1] as string;
      if (fence === null) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = null;
      buffer.push(line);
      continue;
    }

    if (fence === null) {
      if (current === null) {
        const open = OPEN.exec(line);
        if (open) {
          flush();
          current = (open[1] as string).toLowerCase() as CalloutKind;
          continue;
        }
      } else if (CLOSE.test(line)) {
        flush();
        current = null;
        continue;
      }
    }
    buffer.push(line);
  }

  flush();
  return segments;
}
