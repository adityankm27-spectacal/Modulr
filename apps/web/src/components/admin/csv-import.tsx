"use client";

import { CheckCircle2, FileUp, Loader2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { StatusMessage } from "@/components/admin/action-form";
import { Button } from "@/components/ui/button";
import { commitQuestionImport, previewQuestionImport } from "@/lib/admin/actions";
import { IDLE, type ActionState } from "@/lib/admin/state";
import { IMPORT_COLUMNS, MAX_IMPORT_BYTES, type ImportValidation } from "@/lib/question-import";
import { cn } from "@/lib/utils";

/** Upload → per-row validation report → explicit import (spec §5.6). */
export function CsvImport({ subjectId }: { subjectId: string }) {
  const router = useRouter();
  const [csvText, setCsvText] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [report, setReport] = useState<ImportValidation | null>(null);
  const [publish, setPublish] = useState(false);
  const [skipInvalid, setSkipInvalid] = useState(false);
  const [state, setState] = useState<ActionState>(IDLE);
  const [pending, startTransition] = useTransition();

  const invalid = report ? report.rows.length - report.validCount : 0;
  const canImport =
    report !== null &&
    report.fileErrors.length === 0 &&
    report.validCount > 0 &&
    (invalid === 0 || skipInvalid);

  const onFile = (file: File | undefined) => {
    setReport(null);
    setState(IDLE);
    setSkipInvalid(false);
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      setState({
        status: "error",
        message: "The file is larger than 1 MB. Split it into smaller files.",
        at: Date.now(),
      });
      return;
    }
    setFileName(file.name);
    startTransition(async () => {
      const text = await file.text();
      setCsvText(text);
      setReport(await previewQuestionImport(subjectId, text));
    });
  };

  const onImport = () => {
    if (!csvText) return;
    startTransition(async () => {
      const result = await commitQuestionImport({ subjectId, csvText, publish, skipInvalid });
      setState(result);
      if (result.status === "ok") {
        setReport(null);
        setCsvText(null);
        setFileName("");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-muted/60 p-4 text-sm">
        <p className="font-bold">CSV format</p>
        <p className="mt-1 text-muted-foreground">
          Header row with these columns (any order):{" "}
          <code className="font-mono">{IMPORT_COLUMNS.join(", ")}</code>. Required: kind (pyq,
          important or viva), question, answer. Use the module number, or leave it blank for
          questions that span modules. Separate sessions with semicolons. Nothing is saved until you
          press Import.
        </p>
        <a
          href="/templates/questions-import.csv"
          download
          className="mt-2 inline-flex min-h-11 items-center font-bold text-link underline underline-offset-4"
        >
          Download the template
        </a>
      </div>

      <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-input p-6 text-center hover:bg-muted/50">
        <FileUp className="size-6 text-muted-foreground" aria-hidden="true" />
        <span className="font-bold">{fileName || "Choose a CSV file"}</span>
        <span className="text-sm text-muted-foreground">Up to 1 MB, 1,000 questions</span>
        <input
          type="file"
          accept=".csv,text/csv"
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

              <div className="overflow-x-auto rounded-2xl border-2">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th scope="col" className="px-3 py-2">
                        Line
                      </th>
                      <th scope="col" className="px-3 py-2">
                        Type
                      </th>
                      <th scope="col" className="px-3 py-2">
                        Module
                      </th>
                      <th scope="col" className="px-3 py-2">
                        Question
                      </th>
                      <th scope="col" className="px-3 py-2">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {report.rows.map((row) => (
                      <tr key={row.line} className={cn(row.errors.length && "bg-red/5")}>
                        <td className="px-3 py-2 font-mono">{row.line}</td>
                        <td className="px-3 py-2">{row.kind || "—"}</td>
                        <td className="px-3 py-2">{row.module || "All"}</td>
                        <td className="max-w-xs px-3 py-2">{row.preview || "—"}</td>
                        <td className="px-3 py-2">
                          {row.errors.length ? (
                            <ul className="space-y-0.5 text-danger-text">
                              {row.errors.map((e) => (
                                <li key={e}>{e}</li>
                              ))}
                            </ul>
                          ) : (
                            <span className="font-semibold">OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <fieldset className="space-y-2">
                <legend className="sr-only">Import options</legend>
                <label className="flex min-h-11 items-center gap-3 text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={publish}
                    onChange={(e) => setPublish(e.target.checked)}
                    className="size-5 accent-primary"
                  />
                  Publish imported questions straight away (otherwise they are saved as drafts)
                </label>
                {invalid ? (
                  <label className="flex min-h-11 items-center gap-3 text-sm font-bold">
                    <input
                      type="checkbox"
                      checked={skipInvalid}
                      onChange={(e) => setSkipInvalid(e.target.checked)}
                      className="size-5 accent-primary"
                    />
                    Skip the {invalid} row{invalid === 1 ? "" : "s"} with problems
                  </label>
                ) : null}
              </fieldset>

              <Button onClick={onImport} disabled={!canImport || pending}>
                {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                Import {report.validCount} question{report.validCount === 1 ? "" : "s"}
              </Button>
            </>
          )}
        </section>
      ) : null}

      <StatusMessage state={state} />
    </div>
  );
}
