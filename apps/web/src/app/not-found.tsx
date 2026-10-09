import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-16">
      <p className="font-mono text-sm font-bold text-muted-foreground">404</p>
      <h1 className="mt-2 text-4xl">Page not found</h1>
      <p className="mt-3 text-muted-foreground">
        This page doesn&apos;t exist, or the module has moved.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/subjects" className={buttonVariants()}>
          Browse subjects
        </Link>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Home
        </Link>
      </div>
    </main>
  );
}
