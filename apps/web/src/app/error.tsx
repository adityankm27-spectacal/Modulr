"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-16">
      <h1 className="text-4xl">Something went wrong</h1>
      <p className="mt-3 text-muted-foreground">
        We couldn&apos;t load this page. Check your connection and try again.
      </p>
      <div className="mt-8">
        <Button onClick={reset}>
          <RotateCcw aria-hidden="true" />
          Try again
        </Button>
      </div>
    </main>
  );
}
