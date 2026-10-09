import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-base font-bold whitespace-nowrap transition-[background-color,color,box-shadow,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border-2 border-input bg-transparent hover:bg-muted",
        ghost: "hover:bg-muted",
        sunflower: "bg-sunflower text-ink hover:bg-sunflower/90",
        inverted: "bg-white text-ink hover:bg-white/90",
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
