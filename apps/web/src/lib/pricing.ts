/**
 * The numbers that sell a longer plan: how much it saves against paying
 * monthly, and what it works out to per month and per day.
 */

/** Days counted per billing month when showing a per-day price. */
const DAYS_PER_MONTH = 30;

export interface PlanValue {
  /** What paying monthly for the same stretch would cost, or null for the monthly plan itself. */
  fullPricePaise: number | null;
  /** Whole-number saving against paying monthly, or null when there isn't one. */
  discountPercent: number | null;
  perMonthPaise: number;
  perDayPaise: number;
}

export function planValue(
  pricePaise: number,
  billingMonths: number,
  monthlyPricePaise: number | null,
): PlanValue {
  const months = Math.max(1, billingMonths);
  const fullPricePaise = monthlyPricePaise && months > 1 ? monthlyPricePaise * months : null;
  const discountPercent =
    fullPricePaise && fullPricePaise > pricePaise
      ? Math.floor((1 - pricePaise / fullPricePaise) * 100)
      : null;
  return {
    fullPricePaise: discountPercent ? fullPricePaise : null,
    discountPercent: discountPercent || null,
    perMonthPaise: Math.round(pricePaise / months),
    perDayPaise: pricePaise / (months * DAYS_PER_MONTH),
  };
}

/** 222.6 paise → "₹2.23"; always two decimals so small daily prices read clearly. */
export function formatPerDay(paise: number): string {
  return `₹${(Math.ceil(paise) / 100).toFixed(2)}`;
}
