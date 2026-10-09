import type { Enums } from "@modulr/shared";

const wholeRupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const rupeesAndPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 4900 → "₹49", 14950 → "₹149.50". */
export function formatPrice(paise: number): string {
  return (paise % 100 === 0 ? wholeRupees : rupeesAndPaise).format(paise / 100);
}

export function formatInterval(
  interval: Enums<"plan_interval">,
  validityDays: number | null,
): string {
  if (interval === "month") return "per month";
  return validityDays ? `one-time, valid ${validityDays} days` : "one-time";
}

/** 545 → "9 min", 3725 → "1 h 2 min", 40 → "1 min". */
export function formatDuration(seconds: number | null): string | null {
  if (seconds === null || seconds < 0) return null;
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Strips common Markdown/LaTeX syntax for short plain-text previews. */
export function plainPreview(markdown: string, maxLength = 160): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " [formula] ")
    .replace(/\$([^$\n]+)\$/g, "$1")
    .replace(/^:::.*$/gm, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`|]/g, "")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/\\[,;:!]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}
