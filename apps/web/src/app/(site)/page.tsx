import {
  ArrowRight,
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
import { bestValuePlanId, PlanCard } from "@/components/marketing/plan-card";
import { PointerArea } from "@/components/motion/pointer-area";
import { Tilt } from "@/components/motion/tilt";
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
    tone: "bg-periwinkle text-ink",
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

const HERO_BARS = [
  {
    icon: PlayCircle,
    label: "Animated videos",
    bar: "bg-sunflower text-ink",
    chip: "bg-ink text-sunflower",
    offset: "",
    delay: "300ms",
    sway: "0s",
    depth: 14,
  },
  {
    icon: FileText,
    label: "One-page notes",
    bar: "bg-periwinkle text-ink",
    chip: "bg-white text-cobalt",
    offset: "translate-x-8",
    delay: "450ms",
    sway: "-2s",
    depth: -24,
  },
  {
    icon: History,
    label: "Solved PYQs",
    bar: "bg-cobalt text-white",
    chip: "bg-sunflower text-ink",
    offset: "",
    delay: "600ms",
    sway: "-4s",
    depth: 32,
  },
];

const TICKER = [
  "Every module of every subject",
  "Animated videos",
  "One-page notes",
  "Formula sheets",
  "Solved PYQs",
  "Viva prep",
  "Cancel any time",
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
  const monthly =
    plans.find((p) => p.interval === "month" && p.billing_months === 1 && p.scope === "all") ??
    null;
  const startHref = viewer ? "/home" : "/sign-in";

  return (
    <main>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <PointerArea className="relative mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:py-20 lg:grid-cols-[1.25fr_1fr] lg:items-center">
          {/* Soft light that drifts towards the pointer. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[460px] rounded-full bg-periwinkle/25 blur-3xl transition-[translate] duration-700 ease-out"
            style={{
              translate: "calc(-50% + var(--mx, 0) * 260px) calc(-50% + var(--my, 0) * 160px)",
            }}
          />
          <div>
            <p className="inline-block -rotate-2 rounded-full border-[3px] border-line bg-mint px-4 py-1.5 text-sm font-extrabold text-ink motion-safe:animate-rise">
              For engineering students
            </p>
            <h1 className="mt-6 text-5xl font-black sm:text-7xl">
              <span className="block motion-safe:animate-rise motion-safe:[animation-delay:100ms]">
                Every module.
              </span>
              <span className="mt-2 inline-block -rotate-1 rounded-3xl border-[3px] border-line bg-cobalt px-4 pb-2 text-white shadow-[0_6px_0_0_var(--line)] transition-[rotate,scale] duration-300 hover:scale-105 hover:rotate-2 motion-safe:animate-rise motion-safe:[animation-delay:220ms]">
                Inside out.
              </span>
            </h1>
            <p className="mt-8 max-w-xl text-lg text-muted-foreground motion-safe:animate-rise motion-safe:[animation-delay:340ms]">
              Animated explainers, one-page notes, formula sheets and solved PYQs for every module
              of your syllabus. Everything you need for exams, in one place.
            </p>
            <div className="mt-9 flex flex-col gap-4 motion-safe:animate-rise motion-safe:[animation-delay:460ms] sm:flex-row">
              <Link
                href={startHref}
                className={cn(buttonVariants({ variant: "sunflower", size: "lg" }), "group")}
              >
                Get started
                <ArrowRight
                  className="transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>

          {/* The logo's stacked bars, as the three things every module has. */}
          <div aria-hidden="true" className="relative hidden flex-col gap-5 py-6 lg:flex">
            {HERO_BARS.map(({ icon: Icon, label, bar, chip, offset, delay, sway, depth }) => (
              <div
                key={label}
                className="transition-[translate] duration-500 ease-out"
                style={{
                  translate: `calc(var(--mx, 0) * ${depth}px) calc(var(--my, 0) * ${depth / 2}px)`,
                }}
              >
                <div
                  className={cn("motion-safe:animate-slide-in", offset)}
                  style={{ animationDelay: delay }}
                >
                  <div
                    className={cn(
                      "flex h-24 items-center gap-4 rounded-full border-[3px] border-line px-3.5 shadow-[0_7px_0_0_var(--line)] transition-[scale] duration-300 hover:scale-105 motion-safe:animate-sway",
                      bar,
                    )}
                    style={{ animationDelay: sway }}
                  >
                    <span
                      className={cn("flex size-16 items-center justify-center rounded-full", chip)}
                    >
                      <Icon className="size-7" />
                    </span>
                    <span className="font-display text-xl font-extrabold">{label}</span>
                  </div>
                </div>
              </div>
            ))}
            <span
              className="absolute top-0 right-4 rotate-6 rounded-full border-[3px] border-line bg-pink px-4 py-1.5 text-sm font-extrabold text-ink transition-[translate] duration-500 ease-out motion-safe:animate-bob"
              style={{ translate: "calc(var(--mx, 0) * -40px) calc(var(--my, 0) * -26px)" }}
            >
              Viva prep
            </span>
            <span
              className="absolute bottom-0 left-6 -rotate-6 rounded-full border-[3px] border-line bg-orange px-4 py-1.5 text-sm font-extrabold text-ink transition-[translate] duration-500 ease-out motion-safe:animate-bob motion-safe:[animation-delay:-2s]"
              style={{ translate: "calc(var(--mx, 0) * 46px) calc(var(--my, 0) * 30px)" }}
            >
              Formula sheets
            </span>
          </div>
        </PointerArea>
      </section>

      {/* Value strip */}
      <section className="overflow-hidden border-y-[3px] border-line bg-band text-white">
        <div className="flex w-max hover:[animation-play-state:paused] motion-safe:animate-marquee motion-reduce:w-full motion-reduce:justify-center">
          {[false, true].map((copy) => (
            <ul
              key={String(copy)}
              aria-hidden={copy || undefined}
              className={cn(
                "flex shrink-0 items-center gap-10 py-5 pr-10 font-display text-sm font-bold whitespace-nowrap motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-2 motion-reduce:px-4 motion-reduce:whitespace-normal",
                copy && "motion-reduce:hidden",
              )}
            >
              {TICKER.map((item) => (
                <li key={item} className="flex items-center gap-10">
                  {item}
                  <Star className="size-4 fill-sunflower text-sunflower" aria-hidden="true" />
                </li>
              ))}
              {monthly ? (
                <li className="flex items-center gap-10 text-sunflower">
                  {formatPrice(monthly.price_paise)}/month
                  <Star className="size-4 fill-sunflower text-sunflower" aria-hidden="true" />
                </li>
              ) : null}
            </ul>
          ))}
        </div>
      </section>

      {/* Inside a module */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24" aria-labelledby="inside-heading">
        <h2 id="inside-heading" className="text-3xl sm:text-5xl">
          What&apos;s inside every module
        </h2>
        <p className="mt-4 max-w-prose text-lg text-muted-foreground">
          Same six sections every time, so you always know where to look.
        </p>
        <ul className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {INSIDE.map(({ icon: Icon, title, body, tone }) => (
            <li key={title} className="reveal">
              <Tilt
                className={cn(
                  "group h-full rounded-[1.75rem] border-[3px] border-line p-6 shadow-[0_7px_0_0_var(--line)] hover:shadow-[0_13px_0_0_var(--line)]",
                  tone,
                )}
              >
                <span className="flex size-12 items-center justify-center rounded-2xl border-[3px] border-line bg-white text-ink transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-xl font-extrabold">{title}</h3>
                <p className="mt-2">{body}</p>
              </Tilt>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section
        className="border-y-[3px] border-line bg-sunflower text-ink"
        aria-labelledby="how-heading"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <h2 id="how-heading" className="text-3xl sm:text-5xl">
            How it works
          </h2>
          <ol className="mt-12 grid gap-7 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="reveal group rounded-[1.75rem] border-[3px] border-line bg-white p-6 text-ink shadow-[0_7px_0_0_var(--color-ink)] transition-[translate,box-shadow] duration-200 hover:-translate-y-1.5 hover:shadow-[0_13px_0_0_var(--color-ink)]"
              >
                <span className="inline-flex size-14 -rotate-6 transition-[rotate,scale] duration-300 group-hover:scale-110 group-hover:rotate-6 items-center justify-center rounded-2xl border-[3px] border-line bg-cobalt font-display text-2xl font-black text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-display text-xl font-extrabold">{step.title}</h3>
                <p className="mt-2 text-[#4a4858]">{step.body}</p>
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
            Every plan unlocks every module of every subject. Save more with a longer plan.
          </p>
          <div className="reveal mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3 lg:items-center lg:gap-6">
            {plans.slice(0, 3).map((plan, i) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                index={i}
                monthlyPricePaise={monthly?.price_paise ?? null}
                featured={
                  plan.id === (bestValuePlanId(plans, monthly?.price_paise ?? null) ?? monthly?.id)
                }
                // Checkout lives on /pricing; it also shows "Manage your plan" to subscribers.
                cta={
                  viewer
                    ? { href: "/pricing", label: "Subscribe" }
                    : { href: startHref, label: "Get started" }
                }
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
        <div className="reveal mt-8">
          <Faq items={faqItems(settings, monthly?.price_paise ?? null)} />
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-16 sm:pb-24">
        <div className="reveal mx-auto flex max-w-6xl flex-col items-start gap-6 rounded-[1.75rem] border-[3px] border-line bg-sunflower p-8 text-ink shadow-[0_8px_0_0_var(--line)] sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div>
            <BookOpenCheck className="size-10 motion-safe:animate-bob" aria-hidden="true" />
            <h2 className="mt-4 text-3xl sm:text-4xl">Your next exam, sorted.</h2>
          </div>
          <Link href={startHref} className={buttonVariants({ size: "lg" })}>
            Get started
          </Link>
        </div>
      </section>
    </main>
  );
}
