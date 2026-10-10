import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { safeNextPath } from "@/lib/redirect";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Modulr with Google or a one-time code sent to your email.",
};

const CALLBACK_ERROR = "We couldn't finish signing you in. Please try again.";
const ERRORS: Record<string, string> = {
  callback: CALLBACK_ERROR,
  oauth: "Google sign-in was cancelled or failed. Please try again.",
  // Value of SESSION_REPLACED (lib/session.ts).
  "other-device":
    "You were signed out because your account was signed in on another device. Modulr accounts work on one device at a time.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next: rawNext, error } = await searchParams;
  const next = safeNextPath(rawNext);

  if (await getViewer()) redirect(next);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <h1 className="text-3xl sm:text-4xl">Sign in</h1>
      <p className="mt-3 text-muted-foreground">
        New here? Signing in creates your account. No passwords, ever.
      </p>
      <SignInForm next={next} initialError={error ? (ERRORS[error] ?? CALLBACK_ERROR) : null} />
      <p className="mt-8 text-sm text-muted-foreground">
        By continuing you agree to our{" "}
        <Link href="/terms" className="font-bold text-link underline underline-offset-4">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="font-bold text-link underline underline-offset-4">
          Privacy Policy
        </Link>
        .
      </p>
    </main>
  );
}
