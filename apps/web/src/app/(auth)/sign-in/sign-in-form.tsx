"use client";

import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const RESEND_SECONDS = 60;
const OTP_LENGTH = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = { kind: "email" } | { kind: "code"; email: string };

export function SignInForm({ next, initialError }: { next: string; initialError: string | null }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ kind: "email" });
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [pending, setPending] = useState<"google" | "email" | "code" | null>(null);
  const [cooldown, setCooldown] = useState(0);
  // Guards against double submits (double tap, Enter + click): a second verify would
  // fail because codes are single-use, showing an error after a successful sign-in.
  const inFlight = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function signInWithGoogle() {
    setError(null);
    setPending("google");
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", next);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo.toString() },
    });
    // On success the browser navigates away; only errors land here.
    if (error) {
      setError("Couldn't start Google sign-in. Please try again.");
      setPending(null);
    }
  }

  async function sendCode(address: string) {
    if (inFlight.current) return false;
    inFlight.current = true;
    setError(null);
    setPending("email");
    const { error } = await createClient().auth.signInWithOtp({
      email: address,
      options: { shouldCreateUser: true },
    });
    inFlight.current = false;
    setPending(null);
    if (error) {
      setError(
        error.status === 429
          ? "Too many attempts. Please wait a minute and try again."
          : "Couldn't send the code. Check the email address and try again.",
      );
      return false;
    }
    setCooldown(RESEND_SECONDS);
    return true;
  }

  async function onEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(address)) {
      setError("Enter a valid email address.");
      return;
    }
    if (await sendCode(address)) {
      setCode("");
      setStep({ kind: "code", email: address });
    }
  }

  async function onCodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step.kind !== "code") return;
    if (code.length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code from your email.`);
      return;
    }
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    setPending("code");
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: step.email,
      token: code,
      type: "email",
    });
    // If the same code was already used by a duplicate request, we may be signed in anyway.
    if (error && !(await supabase.auth.getSession()).data.session) {
      inFlight.current = false;
      setPending(null);
      setError("That code is wrong or has expired. Check it, or send a new one.");
      return;
    }
    router.replace(next);
    router.refresh();
  }

  const errorId = "sign-in-error";

  if (step.kind === "code") {
    return (
      <form onSubmit={onCodeSubmit} className="mt-8 space-y-5" noValidate>
        <p className="rounded-xl bg-muted p-4 text-sm">
          We sent a {OTP_LENGTH}-digit code to <strong className="break-all">{step.email}</strong>.
          It expires in 10 minutes.
        </p>
        <div>
          <Label htmlFor="code">Code</Label>
          <Input
            id="code"
            name="code"
            className="mt-2 font-mono text-2xl tracking-[0.5em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={OTP_LENGTH}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            autoFocus
          />
          <FieldError id={errorId} message={error ?? undefined} />
        </div>
        <Button type="submit" block disabled={pending !== null}>
          {pending === "code" ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          Verify and continue
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setError(null);
              setStep({ kind: "email" });
            }}
          >
            <ArrowLeft aria-hidden="true" />
            Change email
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={cooldown > 0 || pending !== null}
            onClick={() => void sendCode(step.email)}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <Button
        variant="outline"
        block
        size="lg"
        onClick={() => void signInWithGoogle()}
        disabled={pending !== null}
      >
        {pending === "google" ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </Button>

      <div className="flex items-center gap-3 text-sm text-muted-foreground" role="separator">
        <span className="h-px flex-1 bg-border" />
        or use your email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onEmailSubmit} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            className="mt-2"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
          />
          <FieldError id={errorId} message={error ?? undefined} />
        </div>
        <Button type="submit" block size="lg" disabled={pending !== null}>
          {pending === "email" ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Mail aria-hidden="true" />
          )}
          Email me a code
        </Button>
      </form>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
