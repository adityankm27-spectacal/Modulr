import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-[3px] border-line px-5 text-base font-extrabold whitespace-nowrap shadow-[0_4px_0_0_var(--line)] transition-[background-color,color,box-shadow,translate] duration-150 hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_var(--line)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-1 active:shadow-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "bg-card text-foreground",
        ghost:
          "border-transparent shadow-none hover:translate-y-0 hover:bg-muted hover:shadow-none active:translate-y-0",
        sunflower: "bg-sunflower text-ink",
        inverted: "bg-white text-ink",
      },
      size: {
        default: "",
        sm: "min-h-11 px-4 text-sm",
        lg: "min-h-13 px-7 text-lg",
        icon: "size-11 px-0",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  block,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    />
  );
}
