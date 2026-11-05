import { describe, expect, it } from "vitest";
import { LEGAL, missingLegalDetails } from "./legal";

describe("missingLegalDetails", () => {
  it("lists the required details that are still empty", () => {
    expect(missingLegalDetails({ ...LEGAL, address: null, phone: null })).toEqual([
      "postal address",
      "phone number",
    ]);
    expect(missingLegalDetails({ ...LEGAL, address: "Mumbai", phone: "+91 90000 00000" })).toEqual(
      [],
    );
  });
});
