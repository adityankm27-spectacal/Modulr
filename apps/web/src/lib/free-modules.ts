/**
 * Marketing wording for the modules an admin has made free (is_free_preview).
 * The copy follows the data, so it is never wrong when modules are switched on or off.
 */
export interface FreeModule {
  subject_id: string;
  subject_name: string;
  number: number;
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** "Module 1 of DSA is free", "Module 1 of DSA and OS is free", "3 modules are free". */
export function freeHeadline(modules: readonly FreeModule[]): string | null {
  if (modules.length === 0) return null;
  const numbers = new Set(modules.map((m) => m.number));
  const subjects = [...new Set(modules.map((m) => m.subject_name))];
  if (numbers.size === 1) {
    const [number] = [...numbers];
    return `Module ${number} of ${joinNames(subjects)} is free`;
  }
  return modules.length === 1
    ? `${subjects[0]} Module ${modules[0]?.number} is free`
    : `${modules.length} modules are free`;
}

/** Shorter, for a button or ticker: "Try DSA Module 1 free". */
export function freeShort(modules: readonly FreeModule[]): string | null {
  const first = modules[0];
  if (!first) return null;
  return modules.length === 1
    ? `Try ${first.subject_name} Module ${first.number} free`
    : "Try a free module";
}

/** Where to send someone who wants to try a free module. */
export function firstFreeHref(modules: readonly FreeModule[]): string | null {
  const first = modules[0];
  return first ? `/subjects/${first.subject_id}/modules/${first.number}` : null;
}
