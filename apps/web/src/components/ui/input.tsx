import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "min-h-12 w-full rounded-xl border-2 border-input bg-background px-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none aria-[invalid=true]:border-destructive disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "min-h-12 w-full appearance-none rounded-xl border-2 border-input bg-background bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236b6880%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[position:right_0.875rem_center] bg-no-repeat px-4 pr-11 text-base text-foreground focus-visible:border-ring focus-visible:outline-none aria-[invalid=true]:border-destructive",
        className,
      )}
      {...props}
    />
  );
}
