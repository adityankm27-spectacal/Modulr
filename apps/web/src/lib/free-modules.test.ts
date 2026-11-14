import { describe, expect, it } from "vitest";
import { firstFreeHref, freeHeadline, freeShort, type FreeModule } from "./free-modules";

const dsa1: FreeModule = { subject_id: "s1", subject_name: "DSA", number: 1 };
const os1: FreeModule = { subject_id: "s2", subject_name: "OS", number: 1 };
const os3: FreeModule = { subject_id: "s2", subject_name: "OS", number: 3 };

describe("free module wording", () => {
  it("says nothing when no module is free", () => {
    expect(freeHeadline([])).toBeNull();
    expect(freeShort([])).toBeNull();
    expect(firstFreeHref([])).toBeNull();
  });

  it("names a single free module", () => {
    expect(freeHeadline([dsa1])).toBe("Module 1 of DSA is free");
    expect(freeShort([dsa1])).toBe("Try DSA Module 1 free");
    expect(firstFreeHref([dsa1])).toBe("/subjects/s1/modules/1");
  });

  it("groups first modules of several subjects", () => {
    expect(freeHeadline([dsa1, os1])).toBe("Module 1 of DSA and OS is free");
    expect(freeShort([dsa1, os1])).toBe("Try a free module");
  });

  it("counts modules when the numbers differ", () => {
    expect(freeHeadline([dsa1, os3])).toBe("2 modules are free");
    expect(freeHeadline([os3])).toBe("Module 3 of OS is free");
  });
});
