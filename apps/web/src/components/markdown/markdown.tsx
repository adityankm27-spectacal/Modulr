import "katex/dist/katex.min.css";
import { CALLOUT_LABELS, splitCallouts, type CalloutKind } from "@modulr/shared";
import { BookMarked, Brain, Target, TriangleAlert } from "lucide-react";
import type { ComponentProps } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { cn } from "@/lib/utils";

/**
 * The one Markdown renderer for notes, formula sheets, questions and answers.
 * Used by student pages and the admin live preview, so they always match.
 * Raw HTML in the source is never rendered (react-markdown default).
 */

// Headings shift down one level: the page already has its own <h1>.
const components: Components = {
  h1: ({ node: _node, ...props }) => <h2 {...props} />,
  h2: ({ node: _node, ...props }) => <h3 {...props} />,
  h3: ({ node: _node, ...props }) => <h4 {...props} />,
  h4: ({ node: _node, ...props }) => <h5 {...props} />,
  a: ({ node: _node, href, ...props }) => {
    const external = typeof href === "string" && /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...props}
      />
    );
  },
  // Wide tables and code scroll inside their own box instead of the whole page.
  table: ({ node: _node, ...props }) => (
    <div className="md-scroll">
      <table {...props} />
    </div>
  ),
  img: ({ node: _node, alt, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element -- authored content, unknown dimensions
    <img alt={alt ?? ""} loading="lazy" decoding="async" {...props} />
  ),
};

function Body({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: "ignore" }]]}
      components={components}
    >
      {children}
    </ReactMarkdown>
  );
}

const CALLOUT_ICONS: Record<CalloutKind, typeof Brain> = {
  trick: Brain,
  tip: Target,
  mistake: TriangleAlert,
  definition: BookMarked,
};

export function Callout({ kind, children }: { kind: CalloutKind; children: string }) {
  const Icon = CALLOUT_ICONS[kind];
  return (
    <aside className={cn("md-callout", `md-callout-${kind}`)} aria-label={CALLOUT_LABELS[kind]}>
      <p className="md-callout-label">
        <Icon aria-hidden="true" />
        {CALLOUT_LABELS[kind]}
      </p>
      <Body>{children}</Body>
    </aside>
  );
}

export function Markdown({
  children,
  className,
  ...props
}: { children: string } & Omit<ComponentProps<"div">, "children">) {
  return (
    <div className={cn("md", className)} {...props}>
      {splitCallouts(children).map((segment, index) =>
        segment.type === "callout" ? (
          <Callout key={index} kind={segment.kind}>
            {segment.content}
          </Callout>
        ) : (
          <Body key={index}>{segment.content}</Body>
        ),
      )}
    </div>
  );
}

/** Renders a single LaTeX expression, e.g. a formula card. */
export function Formula({ latex, display = true }: { latex: string; display?: boolean }) {
  return <Markdown className="md-formula">{display ? `$$\n${latex}\n$$` : `$${latex}$`}</Markdown>;
}
