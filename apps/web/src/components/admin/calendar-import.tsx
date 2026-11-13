"use client";

import { CheckCircle2, FileUp, Loader2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { StatusMessage } from "@/components/admin/action-form";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { commitCalendarImport, previewCalendarImport } from "@/lib/admin/calendar-actions";
import { IDLE, type ActionState } from "@/lib/admin/state";
import { MAX_CALENDAR_IMPORT_BYTES, type CalendarImportValidation } from "@/lib/calendar-import";
import { formatRange } from "@/lib/planner/dates";
import { cn } from "@/lib/utils";

export interface CollegeScope {
  id: string;
  name: string;
  branches: { id: string; name: string }[];
}

/** Choose who the events are for → upload → per-row report → explicit import. */
export function CalendarImport({ colleges }: { colleges: CollegeScope[] }) {
  const router = useRouter();
  const [collegeId, setCollegeId] = useState(colleges[0]?.id ?? "");
  const [branchId, setBranchId] = useState("");
  const [semester, setSemester] = useState("");
  const [text, setText] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [report, setReport] = useState<CalendarImportValidation | null>(null);
  const [skipInvalid, setSkipInvalid] = useState(false);
  const [state, setState] = useState<ActionState>(IDLE);
  const [pending, startTransition] = useTransition();

  const branches = colleges.find((c) => c.id === collegeId)?.branches ?? [];
  const invalid = report ? report.rows.length - report.validCount : 0;
  const canImport =
    report !== null &&
    report.fileErrors.length === 0 &&
    report.validCount > 0 &&
    collegeId !== "" &&
    (invalid === 0 || skipInvalid);

  const onFile = (file: File | undefined) => {
    setReport(null);
    setState(IDLE);
    setSkipInvalid(false);
    if (!file) return;
    if (file.size > MAX_CALENDAR_IMPORT_BYTES) {
      setState({ status: "error", message: "The file is larger than 1 MB.", at: Date.now() });
      return;
    }
    setFileName(file.name);
    startTransition(async () => {
      const content = await file.text();
      setText(content);
      setReport(await previewCalendarImport(content, file.name));
    });
  };

  const onImport = () => {
    if (!text) return;
    startTransition(async () => {
      const result = await commitCalendarImport({
        collegeId,
        branchId: branchId || null,
        semester: semester ? Number(semester) : null,
        text,
        fileName,
        skipInvalid,
      });
      setState(result);
      if (result.status === "ok") {
        setReport(null);
        setText(null);
        setFileName("");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-muted/60 p-4 text-sm">
        <p className="font-bold">Accepted files</p>
        <p className="mt-1 text-muted-foreground">
          A calendar file (<code className="font-mono">.ics</code>, exported from Google Calendar or
          Outlook) or a spreadsheet saved as <code className="font-mono">.csv</code> with a header
          row: <code className="font-mono">title, date, end_date, kind, notes</code>. Dates can be
          2026-12-05 or 05/12/2026. If the kind is blank, it&apos;s guessed from the title (exam,
          holiday, deadline). Nothing is saved until you press Import, and importing the same file
          twice never creates duplicates.
        </p>
        <a
          href="/templates/calendar-import.csv"
          download
          className="mt-2 inline-flex min-h-11 items-center font-bold text-link underline underline-offset-4"
        >
          Download the CSV template
        </a>
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="sr-only">Who the events are for</legend>
        <div>
          <Label htmlFor="cal-college">College</Label>
          <Select
            id="cal-college"
            className="mt-2"
            value={collegeId}
            onChange={(e) => {
              setCollegeId(e.target.value);
              setBranchId("");
            }}
          >
            {colleges.map((college) => (
              <option key={college.id} value={college.id}>
                {college.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="cal-branch">Branch</Label>
          <Select
            id="cal-branch"
            className="mt-2"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          >
            <option value="">All branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="cal-semester">Semester</Label>
          <Select
            id="cal-semester"
            className="mt-2"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          >
            <option value="">All semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                Semester {n}
              </option>
            ))}
          </Select>
        </div>
      </fieldset>

      <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-input p-6 text-center hover:bg-muted/50">
        <FileUp className="size-6 text-muted-foreground" aria-hidden="true" />
        <span className="font-bold">{fileName || "Choose a calendar file"}</span>
        <span className="text-sm text-muted-foreground">.ics or .csv, up to 1 MB</span>
        <input
          type="file"
          accept=".ics,.csv,text/calendar,text/csv"
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>

      {pending && !report ? (
        <p className="flex items-center gap-2 text-sm font-semibold" role="status">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Checking the file…
        </p>
      ) : null}

      {report ? (
        <section aria-label="Validation report" className="space-y-4">
          {report.fileErrors.length ? (
            <div role="alert" className="rounded-2xl border-2 border-destructive p-4">
              <p className="font-bold text-danger-text">This file can&apos;t be imported</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {report.fileErrors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          ) : (
            <>
              <p className="flex flex-wrap gap-x-4 gap-y-1 font-bold" role="status">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
                  {report.validCount} ready to import
                </span>
                {invalid ? (
                  <span className="inline-flex items-center gap-1.5 text-danger-text">
                    <TriangleAlert className="size-5" aria-hidden="true" />
                    {invalid} with problems
                  </span>
                ) : null}
              </p>

              <div className="max-h-96 overflow-auto rounded-2xl border-2">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th scope="col" className="px-3 py-2">
                        Line
                      </th>
                      <th scope="col" className="px-3 py-2">
                        Event
                      </th>
                      <th scope="col" className="px-3 py-2">
                        Date
                      </th>
                      <th scope="col" className="px-3 py-2">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map((row) => (
                      <tr
                        key={row.line}
                        className={cn("border-t", row.errors.length && "bg-danger/5")}
                      >
                        <td className="px-3 py-2 font-mono">{row.line}</td>
                        <td className="px-3 py-2 font-bold">{row.title || "(no title)"}</td>
                        <td className="px-3 py-2">
                          {row.value
                            ? formatRange(row.value.starts_on, row.value.ends_on)
                            : row.date}
                          {row.value ? (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {row.value.kind}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2">
                          {row.errors.length ? (
                            <span className="text-danger-text">{row.errors.join(" ")}</span>
                          ) : (
                            "OK"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {invalid ? (
                <label className="flex items-center gap-3 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={skipInvalid}
                    onChange={(e) => setSkipInvalid(e.target.checked)}
                    className="size-5 accent-primary"
                  />
                  Skip the {invalid} row{invalid === 1 ? "" : "s"} with problems and import the rest
                </label>
              ) : null}

              <Button type="button" onClick={onImport} disabled={!canImport || pending}>
                {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                Import {report.validCount} event{report.validCount === 1 ? "" : "s"}
              </Button>
            </>
          )}
        </section>
      ) : null}

      <StatusMessage state={state} />
    </div>
  );
}
