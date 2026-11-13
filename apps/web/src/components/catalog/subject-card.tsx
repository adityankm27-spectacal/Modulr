"use client";

import {
  ArrowUpRight,
  Atom,
  Brain,
  Code,
  Cpu,
  Database,
  Globe,
  Infinity as InfinityIcon,
  Layers,
  Lightbulb,
  Network,
  Puzzle,
  Rocket,
  ShieldCheck,
  Sigma,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { CSSProperties, PointerEvent } from "react";
import { pluralize } from "@/lib/format";
import type { SubjectIcon, SubjectTone } from "@/lib/subject-style";
import { cn } from "@/lib/utils";

const ICONS: Record<SubjectIcon, LucideIcon> = {
  graph: Network,
  database: Database,
  cpu: Cpu,
  infinity: InfinityIcon,
  trending: TrendingUp,
  sigma: Sigma,
  code: Code,
  globe: Globe,
  shield: ShieldCheck,
  brain: Brain,
  atom: Atom,
  layers: Layers,
  puzzle: Puzzle,
  rocket: Rocket,
  lightbulb: Lightbulb,
};

// Sunflower, mint, orange and pink are fills that need dark text (see globals.css).
const TONES: Record<SubjectTone, { tile: string; color: string; ink: string }> = {
  cobalt: { tile: "bg-cobalt text-white", color: "var(--color-cobalt)", ink: "white" },
  sunflower: {
    tile: "bg-sunflower text-ink",
    color: "var(--color-sunflower)",
    ink: "var(--color-ink)",
  },
  mint: { tile: "bg-mint text-ink", color: "var(--color-mint)", ink: "var(--color-ink)" },
  pink: { tile: "bg-pink text-ink", color: "var(--color-pink)", ink: "var(--color-ink)" },
  orange: { tile: "bg-orange text-ink", color: "var(--color-orange)", ink: "var(--color-ink)" },
  periwinkle: { tile: "bg-periwinkle text-white", color: "var(--color-periwinkle)", ink: "white" },
};

/** Moves the glow to the pointer; CSS does the rest. */
function trackPointer(event: PointerEvent<HTMLElement>) {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  card.style.setProperty("--x", `${event.clientX - rect.left}px`);
  card.style.setProperty("--y", `${event.clientY - rect.top}px`);
}

export function SubjectCard({
  href,
  name,
  description,
  moduleCount,
  icon,
  tone,
  index,
}: {
  href: string;
  name: string;
  description: string | null;
  moduleCount: number;
  icon: SubjectIcon;
  tone: SubjectTone;
  index: number;
}) {
  const Icon = ICONS[icon];
  const { tile, color, ink } = TONES[tone];

  return (
    <Link
      href={href}
      onPointerMove={trackPointer}
      style={
        { "--tone": color, "--tone-ink": ink, animationDelay: `${index * 70}ms` } as CSSProperties
      }
      className="group relative isolate flex h-full flex-col overflow-hidden rounded-[1.75rem] border-[3px] border-line bg-card p-6 shadow-[0_7px_0_0_var(--tone)] transition-[translate,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_11px_0_0_var(--tone)] focus-visible:-translate-y-1 focus-visible:shadow-[0_11px_0_0_var(--tone)] focus-visible:outline-none active:translate-y-1 active:shadow-none motion-safe:animate-rise"
    >
      {/* Soft glow in the subject's colour that follows the pointer. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(260px circle at var(--x, 50%) var(--y, 50%), color-mix(in oklab, var(--tone) 22%, transparent), transparent 70%)",
        }}
      />

      <span className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex size-14 items-center justify-center rounded-2xl border-[3px] border-line transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6",
            tile,
          )}
        >
          <Icon className="size-7" aria-hidden="true" />
        </span>
        <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-[translate,background-color,color] duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:bg-(--tone) group-hover:text-(--tone-ink)">
          <ArrowUpRight className="size-5" aria-hidden="true" />
        </span>
      </span>

      <span className="mt-6 font-display text-2xl font-black leading-tight">{name}</span>
      {description ? (
        <span className="mt-2 line-clamp-2 text-sm text-muted-foreground">{description}</span>
      ) : null}
      <span className="mt-auto pt-4 text-sm font-bold">
        {moduleCount > 0 ? (
          <span>{pluralize(moduleCount, "module")}</span>
        ) : (
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            Coming soon
          </span>
        )}
      </span>
    </Link>
  );
}
