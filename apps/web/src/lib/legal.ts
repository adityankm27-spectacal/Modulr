/**
 * Business details shown on the legal pages (Consumer Protection (E-Commerce) Rules,
 * 2020 and the DPDP Act, 2023 require them to be published). Change them here only.
 * Must match the name on the Razorpay KYC.
 */
export interface LegalDetails {
  brand: string;
  operators: readonly string[];
  supportEmail: string;
  phone: string | null;
  address: string | null;
  grievanceOfficer: string;
  /** Courts with jurisdiction over disputes. */
  jurisdiction: string;
  lastUpdated: string;
}

export const LEGAL: LegalDetails = {
  brand: "Modulr",
  operators: ["Aditya Nikam", "Rudrapratap Singh"],
  supportEmail: "modulrsupport@gmail.com",
  phone: null,
  address: null,
  grievanceOfficer: "Rudrapratap Singh",
  jurisdiction: "Mumbai, Maharashtra",
  lastUpdated: "5 November 2026",
};

/** "Aditya Nikam and Rudrapratap Singh" */
export const operatorNames = LEGAL.operators.join(" and ");

/** Details the law requires that are still missing; the legal pages flag them until filled. */
export function missingLegalDetails(details: LegalDetails = LEGAL): string[] {
  return [
    ...(details.address ? [] : ["postal address"]),
    ...(details.phone ? [] : ["phone number"]),
  ];
}
