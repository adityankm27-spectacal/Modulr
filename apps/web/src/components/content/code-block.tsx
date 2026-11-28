import { highlightJava, type TokenType } from "@/lib/java-highlight";
import { CopyCodeButton } from "./copy-code-button";

/** Token colours on the dark code panel (same in light and dark mode). */
const TOKEN_CLASS: Record<TokenType, string | undefined> = {
  keyword: "text-[#ffc629] font-semibold",
  type: "text-[#9aa8ff]",
  string: "text-[#5fe3b8]",
  comment: "text-white/45 italic",
  number: "text-[#ff8fc0]",
  annotation: "text-[#ffa45c]",
  plain: undefined,
};

/**
 * A program's source with line numbers, Java colours and a Copy button. Long lines
 * scroll sideways instead of wrapping, so indentation stays readable.
 */
export function CodeBlock({
  code,
  fileName,
  language = "java",
}: {
  code: string;
  fileName: string;
  language?: string;
}) {
  const lines = highlightJava(code.replace(/\s+$/, ""));
  const gutter = String(lines.length).length;

  return (
    <figure className="overflow-hidden rounded-2xl border-[3px] border-line bg-[#15141d] text-white shadow-[0_5px_0_0_var(--line)]">
      <figcaption className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2">
        <span className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#ffc629]" />
            <span className="size-2.5 rounded-full bg-[#1fd49e]" />
          </span>
          <span className="truncate font-mono text-sm text-white/80">{fileName}</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-xs uppercase text-white/70">
            {language}
          </span>
        </span>
        <CopyCodeButton code={code} />
      </figcaption>
      {/* No ligatures: students should see "==" and "++" as typed, not merged symbols. */}
      <pre className="overflow-x-auto py-3 font-mono text-[13px] leading-6 [font-variant-ligatures:none] sm:text-sm">
        <code className="block min-w-max">
          {lines.map((tokens, i) => (
            <span key={i} className="flex px-4 hover:bg-white/5">
              <span
                aria-hidden="true"
                className="mr-4 shrink-0 text-right text-white/30 select-none"
                style={{ width: `${gutter}ch` }}
              >
                {i + 1}
              </span>
              <span className="whitespace-pre">
                {tokens.length === 0
                  ? " "
                  : tokens.map((t, j) => (
                      <span key={j} className={TOKEN_CLASS[t.type]}>
                        {t.text}
                      </span>
                    ))}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}
