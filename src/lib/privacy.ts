/**
 * Returns stay open for public inspection for 6 years after the Commission receives them
 * (Electoral Act 1993, s 3, "public inspection period"). After that, this site does not
 * name individual donors, or organisations whose listed name includes a person (via, trustee,
 * directors). Organisations stay named. Amounts and parties stay in totals.
 */
export const INSPECTION_YEARS = 6;

export const OLD_INDIVIDUAL_LABEL = "Name withheld (return over 6 years old)";

/** ISO date (YYYY-MM-DD) 6 years before the given moment, in New Zealand time. */
export function inspectionCutoffIso(now: Date): string {
  const nz = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Auckland",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const [year, month, day] = nz.split("-").map(Number);
  return `${year - INSPECTION_YEARS}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** True when the return was received before the cutoff. */
export function isPastInspection(returnIso: string, cutoffIso: string): boolean {
  return returnIso < cutoffIso;
}

/** Organisation names that also name a person, such as "X Trust via Jane Smith". */
const NAMES_A_PERSON = /\bvia\b|\btrustee\b|\bdirectors?\b/i;

/** True when an old return's donor name should be withheld. */
export function withholdName(isIndividual: boolean, name: string): boolean {
  return isIndividual || NAMES_A_PERSON.test(name);
}
