import { describe, expect, it } from "vitest";
import { formatPerDay, planValue } from "./pricing";

describe("planValue", () => {
  it("has no discount for the monthly plan itself", () => {
    expect(planValue(9900, 1, 9900)).toEqual({
      fullPricePaise: null,
      discountPercent: null,
      perMonthPaise: 9900,
      perDayPaise: 330,
    });
  });

  it("compares a 3-month plan with paying monthly", () => {
    const value = planValue(24900, 3, 9900);
    expect(value.fullPricePaise).toBe(29700);
    expect(value.discountPercent).toBe(16);
    expect(value.perMonthPaise).toBe(8300);
    expect(formatPerDay(value.perDayPaise)).toBe("₹2.77");
  });

  it("compares a 6-month plan with paying monthly", () => {
    const value = planValue(39900, 6, 9900);
    expect(value.fullPricePaise).toBe(59400);
    expect(value.discountPercent).toBe(32);
    expect(value.perMonthPaise).toBe(6650);
    expect(formatPerDay(value.perDayPaise)).toBe("₹2.22");
  });

  it("shows no saving without a monthly plan, or when the longer plan costs more", () => {
    expect(planValue(24900, 3, null).discountPercent).toBeNull();
    expect(planValue(39900, 3, 9900)).toMatchObject({
      fullPricePaise: null,
      discountPercent: null,
    });
  });
});
