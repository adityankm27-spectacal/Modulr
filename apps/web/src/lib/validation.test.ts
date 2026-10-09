import { describe, expect, it } from "vitest";
import { fieldErrors, isUuid, onboardingSchema, parseSemester, profileSchema } from "./validation";

const valid = {
  fullName: "  Asha Rao ",
  collegeId: "10000000-0000-4000-8000-000000000001",
  branchId: "20000000-0000-4000-8000-000000000001",
  semester: "3",
};

describe("profileSchema", () => {
  it("parses and normalises form input", () => {
    expect(profileSchema.parse(valid)).toEqual({ ...valid, fullName: "Asha Rao", semester: 3 });
  });

  it("reports one message per field", () => {
    const result = profileSchema.safeParse({
      fullName: "A",
      collegeId: "",
      branchId: "x",
      semester: "9",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = fieldErrors(result.error);
      expect(Object.keys(errors).sort()).toEqual(["branchId", "collegeId", "fullName", "semester"]);
      expect(errors.semester).toBe("Choose your semester.");
    }
  });
});

describe("onboardingSchema", () => {
  it("requires age confirmation and consent", () => {
    const result = onboardingSchema.safeParse(valid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(fieldErrors(result.error)).sort()).toEqual(["ageConfirmed", "consent"]);
    }
    expect(
      onboardingSchema.safeParse({ ...valid, ageConfirmed: "on", consent: "on" }).success,
    ).toBe(true);
  });
});

describe("parseSemester", () => {
  it("accepts 1 to 8 only", () => {
    expect(parseSemester("4")).toBe(4);
    expect(parseSemester(["2"])).toBe(2);
    expect(parseSemester("0")).toBeNull();
    expect(parseSemester("9")).toBeNull();
    expect(parseSemester("2.5")).toBeNull();
    expect(parseSemester(undefined)).toBeNull();
  });
});

describe("isUuid", () => {
  it("validates ids before they reach the database", () => {
    expect(isUuid("40000000-0000-4000-8000-000000000001")).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
  });
});
