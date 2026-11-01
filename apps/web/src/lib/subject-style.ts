/**
 * A distinct icon and brand colour for each subject card on the home page.
 * Icons are matched from the subject's name and code; anything unmatched (or
 * already taken on the page) gets the next unused icon, so no two cards share one.
 */

export const SUBJECT_ICONS = [
  "graph",
  "database",
  "cpu",
  "infinity",
  "trending",
  "sigma",
  "code",
  "globe",
  "shield",
  "brain",
  "atom",
  "layers",
  "puzzle",
  "rocket",
  "lightbulb",
] as const;
export type SubjectIcon = (typeof SUBJECT_ICONS)[number];

export const SUBJECT_TONES = [
  "cobalt",
  "sunflower",
  "mint",
  "pink",
  "orange",
  "periwinkle",
] as const;
export type SubjectTone = (typeof SUBJECT_TONES)[number];

const KEYWORDS: ReadonlyArray<[RegExp, SubjectIcon]> = [
  [/\bdsa\b|data struct|algorithm/i, "graph"],
  [/\bdbms\b|database|\bsql\b/i, "database"],
  [/\bos\b|operating system/i, "cpu"],
  [/devops/i, "infinity"],
  [/\bfm\b|financ|econom|account/i, "trending"],
  [/math|calculus|statistic/i, "sigma"],
  [/program|coding|java|python/i, "code"],
  [/network|\bweb\b|internet/i, "globe"],
  [/secur|crypt/i, "shield"],
  [/\bai\b|\bml\b|intelligen|machine learn/i, "brain"],
];

export function subjectStyles(
  subjects: ReadonlyArray<{ id: string; name: string; code: string }>,
): Map<string, { icon: SubjectIcon; tone: SubjectTone }> {
  const used = new Set<SubjectIcon>();
  const styles = new Map<string, { icon: SubjectIcon; tone: SubjectTone }>();
  subjects.forEach((subject, i) => {
    const text = `${subject.name} ${subject.code}`;
    const matched = KEYWORDS.find(([re, icon]) => re.test(text) && !used.has(icon))?.[1];
    const icon =
      matched ??
      SUBJECT_ICONS.find((candidate) => !used.has(candidate)) ??
      SUBJECT_ICONS[i % SUBJECT_ICONS.length] ??
      "atom";
    used.add(icon);
    styles.set(subject.id, { icon, tone: SUBJECT_TONES[i % SUBJECT_TONES.length] ?? "cobalt" });
  });
  return styles;
}
