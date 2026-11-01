import { describe, expect, it } from "vitest";
import { subjectStyles } from "./subject-style";

const subject = (id: string, name: string, code = "") => ({ id, name, code });

describe("subjectStyles", () => {
  it("matches icons from the subject's name or code", () => {
    const styles = subjectStyles([
      subject("1", "DSA", "DSA"),
      subject("2", "DBMS", "IT"),
      subject("3", "OS", "OS.1"),
      subject("4", "DevOps", "devops.1"),
      subject("5", "Operating Systems"),
    ]);
    expect(styles.get("1")?.icon).toBe("graph");
    expect(styles.get("2")?.icon).toBe("database");
    expect(styles.get("3")?.icon).toBe("cpu");
    expect(styles.get("4")?.icon).toBe("infinity");
  });

  it("never gives two cards the same icon", () => {
    const styles = subjectStyles([
      subject("1", "Operating Systems"),
      subject("2", "OS Lab"),
      subject("3", "History"),
      subject("4", "Art"),
    ]);
    const icons = [...styles.values()].map((s) => s.icon);
    expect(new Set(icons).size).toBe(icons.length);
    expect(styles.get("1")?.icon).toBe("cpu");
  });

  it("gives neighbouring cards different colours", () => {
    const tones = [...subjectStyles([subject("1", "A"), subject("2", "B")]).values()].map(
      (s) => s.tone,
    );
    expect(tones[0]).not.toBe(tones[1]);
  });
});
