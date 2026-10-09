import {
  BookOpenCheck,
  FileText,
  History,
  MessageCircleQuestion,
  PlayCircle,
  Sigma,
  Star,
} from "lucide-react";
import Link from "next/link";
import { Faq } from "@/components/marketing/faq";
import { PlanCard } from "@/components/marketing/plan-card";
import { buttonVariants } from "@/components/ui/button";
import { getViewer } from "@/lib/auth";
import { getActivePlans, getSettings } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { faqItems } from "@/lib/marketing";
import { cn } from "@/lib/utils";

const INSIDE = [
  {
    icon: PlayCircle,
    title: "Animated videos",
    body: "Short explainers that make each topic click, with chapters so you can jump to what you need.",
    tone: "bg-cobalt text-white",
  },
  {
    icon: FileText,
    title: "Short notes",
    body: "One page per module, with memory tricks, exam tips and the mistakes to avoid.",
    tone: "bg-sunflower text-ink",
  },
  {
    icon: Sigma,
    title: "Formula sheets",
    body: "Every formula, what each symbol means, and when to use it.",
    tone: "bg-periwinkle text-white",
  },
  {
    icon: History,
    title: "Solved PYQs",
    body: "Previous-year questions with full answers, by marks and exam session.",
    tone: "bg-mint text-ink",
  },
  {
    icon: Star,
    title: "Important questions",
    body: "The questions that keep coming back, ranked by how often they appear.",
    tone: "bg-orange text-ink",
  },
  {
    icon: MessageCircleQuestion,
    title: "Viva prep",
    body: "Quick question-and-answer pairs for practicals and orals.",
    tone: "bg-pink text-ink",
  },
];

const STEPS = [
  { title: "Pick your semester", body: "Your subjects appear first, organised module by module." },
  {
    title: "Learn each module",
    body: "Watch the explainer, then lock it in with one page of notes.",
  },
  {
    title: "Revise like a topper",
    body: "Practise solved PYQs and important questions before exams.",
  },
];

export default async function LandingPage() {
  const [viewer, plans, settings] = await Promise.all([
    getViewer(),
    getActivePlans(),
    getSettings(),
  ]);
  const monthly = plans.find((p) => p.interval === "month" && p.scope === "all") ?? null;
  const startHref = viewer ? "/home" : "/sign-in";

  return (
    <main>
      {/* Hero */}
      <section className="bg-cobalt text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:py-24 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-sm font-bold">
              For engineering students
            </p>
            <h1 className="mt-5 text-5xl font-black sm:text-7xl">
              Every module.
              <br />
              <span className="text-sunflower">Inside out.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/90">
              Animated explainers, one-page notes, formula sheets and solved PYQs for every module
              of your syllabus. Everything you need for exams, in one place.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={startHref}
                className={buttonVariants({ variant: "sunflower", size: "lg" })}
              >
                {viewer ? "Go to my subjects" : "Start free"}
              </Link>
              <Link
                href="/subjects"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "border-white/60 text-white hover:bg-white/10",
                )}
              >
                Browse subjects
              </Link>
            </div>
          </div>
          <div aria-hidden="true" className="hidden flex-col gap-4 lg:flex">
            <div className="h-24 rounded-full bg-sunflower" />
            <div className="h-24 translate-x-8 rounded-full bg-periwinkle" />
            <div className="h-24 rounded-full bg-white" />
          </div>
        </div>
      </section>

      {/* Value strip */}
      <section className="bg-sunflower text-ink">
        <ul className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-center font-bold sm:flex-row sm:justify-center sm:gap-8">
          <li>Module 1 of every subject is free</li>
          {monthly ? <li>{formatPrice(monthly.price_paise)}/month after that</li> : null}
          <li>Cancel any time</li>
        </ul>
      </section>

      {/* Inside a module */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24" aria-labelledby="inside-heading">
        <h2 id="inside-heading" className="text-3xl sm:text-5xl">
          What&apos;s inside every module
        </h2>
        <p className="mt-4 max-w-prose text-lg text-muted-foreground">
          Same six sections every time, so you always know where to look.
        </p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INSIDE.map(({ icon: Icon, title, body, tone }) => (
            <li key={title} className="rounded-3xl border-2 bg-card p-6">
              <span className={cn("flex size-12 items-center justify-center rounded-2xl", tone)}>
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-sans text-xl font-extrabold tracking-normal">{title}</h3>
              <p className="mt-2 text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section className="bg-band text-white" aria-labelledby="how-heading">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <h2 id="how-heading" className="text-3xl sm:text-5xl">
            How it works
          </h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="rounded-3xl bg-white/5 p-6">
                <span className="font-display text-5xl font-black text-sunflower">{i + 1}</span>
                <h3 className="mt-4 font-sans text-xl font-extrabold tracking-normal">
                  {step.title}
                </h3>
                <p className="mt-2 text-white/80">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pricing */}
      {plans.length > 0 ? (
        <section
          className="mx-auto max-w-6xl px-4 py-16 sm:py-24"
          aria-labelledby="pricing-heading"
        >
          <h2 id="pricing-heading" className="text-3xl sm:text-5xl">
            Simple pricing
          </h2>
          <p className="mt-4 max-w-prose text-lg text-muted-foreground">
            Start with the free module of any subject. Upgrade when you&apos;re ready.
          </p>
          <div className="mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
            {plans.slice(0, 2).map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                featured={plan.id === monthly?.id}
                cta={{ href: startHref, label: viewer ? "Go to my subjects" : "Start free" }}
              />
            ))}
          </div>
          <Link
            href="/pricing"
            className="mt-6 inline-flex min-h-11 items-center font-bold text-link underline underline-offset-4"
          >
            Compare all plans
          </Link>
        </section>
      ) : null}

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-16 sm:pb-24" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-3xl sm:text-5xl">
          Questions
        </h2>
        <div className="mt-8">
          <Faq items={faqItems(settings, monthly?.price_paise ?? null)} />
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-16 sm:pb-24">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 rounded-3xl bg-sunflower p-8 text-ink sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div>
            <BookOpenCheck className="size-10" aria-hidden="true" />
            <h2 className="mt-4 text-3xl sm:text-4xl">Your next exam, sorted.</h2>
          </div>
          <Link href={startHref} className={buttonVariants({ size: "lg" })}>
            {viewer ? "Go to my subjects" : "Start free"}
          </Link>
        </div>
      </section>
    </main>
  );
}
