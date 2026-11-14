import type { AppSettings } from "@modulr/shared";
import { formatPrice } from "@/lib/format";

/** FAQ copy shared by the landing and pricing pages. Numbers come from the database. */
export function faqItems(
  settings: AppSettings,
  monthlyPricePaise: number | null,
  freeHeadline: string | null = null,
) {
  const price = monthlyPricePaise
    ? `${formatPrice(monthlyPricePaise)} a month`
    : "A small monthly fee";
  const devices = settings["devices.max_active"];
  return [
    ...(freeHeadline
      ? [
          {
            q: "Is any of it free?",
            a: `Yes. ${freeHeadline}: sign in and open its videos, notes and solved questions with no payment. A subscription unlocks every other module.`,
          },
        ]
      : []),
    {
      q: "What do I get with a subscription?",
      a: "Every module of every subject: animated explainer videos, one-page notes, formula sheets, solved PYQs, important questions and viva prep.",
    },
    {
      q: "How much does it cost?",
      a: `${price}. Cancel any time and keep access until the end of the period you paid for.`,
    },
    {
      q: "Which syllabus does Modulr follow?",
      a: "Content is organised exactly like your syllabus: semester, subject, module. We're starting with Information Technology and adding more semesters and branches.",
    },
    {
      q: "Can I share my account?",
      a: `No. Accounts are personal and work on up to ${devices} ${devices === 1 ? "device" : "devices"}. Shared accounts are banned without a refund.`,
    },
    {
      q: "Who writes the content?",
      a: "Every video, note and answer is original, written for Modulr and reviewed for accuracy before it's published. Spot a mistake? Report it from the page and we'll fix it.",
    },
    {
      q: "Is Modulr connected to my college?",
      a: "No. Modulr is independent and isn't affiliated with any college or university.",
    },
  ];
}
