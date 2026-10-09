import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        neutral: "bg-muted text-muted-foreground",
        free: "bg-mint text-ink",
        locked: "bg-muted text-foreground",
        highlight: "bg-sunflower text-ink",
        primary: "bg-accent text-accent-foreground",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
