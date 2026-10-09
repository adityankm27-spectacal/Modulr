import { colors } from "@modulr/shared/brand";
import { cn } from "@/lib/utils";

/**
 * "The Stack" mark: three stacked rounded bars (spec §3). Drawn inline until the
 * final logo kit is added to packages/shared/brand.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <rect x="3" y="4" width="26" height="7" rx="3.5" fill={colors.sunflower} />
      <rect x="3" y="12.5" width="26" height="7" rx="3.5" fill={colors.periwinkle} />
      <rect x="3" y="21" width="26" height="7" rx="3.5" fill={colors.cobalt} />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-display text-xl font-black tracking-[-0.03em]">Modulr</span>
    </span>
  );
}
