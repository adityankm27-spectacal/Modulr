import {
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
import type { SubjectIcon, SubjectTone } from "@/lib/subject-style";

/** The icon drawn for each subject. */
export const SUBJECT_ICON: Record<SubjectIcon, LucideIcon> = {
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
// `ink` is for small marks on the colour; `text` is for body copy on a large fill.
export const SUBJECT_TONE: Record<
  SubjectTone,
  { tile: string; color: string; ink: string; text: string }
> = {
  cobalt: {
    tile: "bg-cobalt text-white",
    color: "var(--color-cobalt)",
    ink: "white",
    text: "white",
  },
  sunflower: {
    tile: "bg-sunflower text-ink",
    color: "var(--color-sunflower)",
    ink: "var(--color-ink)",
    text: "var(--color-ink)",
  },
  mint: {
    tile: "bg-mint text-ink",
    color: "var(--color-mint)",
    ink: "var(--color-ink)",
    text: "var(--color-ink)",
  },
  pink: {
    tile: "bg-pink text-ink",
    color: "var(--color-pink)",
    ink: "var(--color-ink)",
    text: "var(--color-ink)",
  },
  orange: {
    tile: "bg-orange text-ink",
    color: "var(--color-orange)",
    ink: "var(--color-ink)",
    text: "var(--color-ink)",
  },
  periwinkle: {
    tile: "bg-periwinkle text-white",
    color: "var(--color-periwinkle)",
    ink: "white",
    text: "var(--color-ink)",
  },
};
