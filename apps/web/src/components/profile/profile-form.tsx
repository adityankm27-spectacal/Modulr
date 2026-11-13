"use client";

import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import type { ProfileFormState, ProfileFormValues } from "@/lib/actions/profile";
import { AVAILABLE_SEMESTERS } from "@/lib/validation";

export interface CollegeOption {
  id: string;
  name: string;
  branches: { id: string; name: string; code: string }[];
}

type Action = (state: ProfileFormState, formData: FormData) => Promise<ProfileFormState>;

export function ProfileForm({
  action,
  colleges,
  defaults,
  mode,
  next,
}: {
  action: Action;
  colleges: CollegeOption[];
  defaults: ProfileFormValues;
  mode: "onboarding" | "edit";
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {
    errors: {},
    values: null,
    saved: false,
  });
  const values = state.values ?? defaults;
  const errors = state.errors;

  // Pre-select when there is only one choice (launch: one college, one branch).
  const [collegeId, setCollegeId] = useState(
    values.collegeId || (colleges.length === 1 ? (colleges[0]?.id ?? "") : ""),
  );
  const branches = colleges.find((c) => c.id === collegeId)?.branches ?? [];
  const [branchId, setBranchId] = useState(
    values.branchId || (branches.length === 1 ? (branches[0]?.id ?? "") : ""),
  );

  // With a single semester on offer there is nothing to choose, so it starts selected.
  const [semester, setSemester] = useState(
    values.semester || (AVAILABLE_SEMESTERS.length === 1 ? String(AVAILABLE_SEMESTERS[0]) : ""),
  );

  const describedBy = (field: string) => (errors[field] ? `${field}-error` : undefined);

  return (
    <form
      // `action` keeps the form working without JavaScript. With JavaScript we submit in a
      // transition instead, because React's automatic reset after a form action snaps
      // <select> elements back to their first-render values.
      action={formAction}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="space-y-6"
      noValidate
    >
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div>
        <Label htmlFor="fullName">Your name</Label>
        <Input
          id="fullName"
          name="fullName"
          className="mt-2"
          autoComplete="name"
          defaultValue={values.fullName}
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={describedBy("fullName")}
          required
        />
        <FieldError id="fullName-error" message={errors.fullName} />
      </div>

      <div>
        <Label htmlFor="collegeId">College</Label>
        <Select
          id="collegeId"
          name="collegeId"
          className="mt-2"
          value={collegeId}
          onChange={(e) => {
            const id = e.target.value;
            setCollegeId(id);
            const options = colleges.find((c) => c.id === id)?.branches ?? [];
            setBranchId(options.length === 1 ? (options[0]?.id ?? "") : "");
          }}
          aria-invalid={Boolean(errors.collegeId)}
          aria-describedby={describedBy("collegeId")}
          required
        >
          <option value="" disabled>
            Choose your college
          </option>
          {colleges.map((college) => (
            <option key={college.id} value={college.id}>
              {college.name}
            </option>
          ))}
        </Select>
        <FieldError id="collegeId-error" message={errors.collegeId} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="branchId">Branch</Label>
          <Select
            id="branchId"
            name="branchId"
            className="mt-2"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            disabled={!collegeId}
            aria-invalid={Boolean(errors.branchId)}
            aria-describedby={describedBy("branchId")}
            required
          >
            <option value="" disabled>
              Choose your branch
            </option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </Select>
          <FieldError id="branchId-error" message={errors.branchId} />
        </div>

        {mode === "onboarding" ? (
          <fieldset aria-describedby={describedBy("semester")}>
            <legend className="font-bold">Current semester</legend>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {AVAILABLE_SEMESTERS.map((n) => (
                <label key={n} className="relative">
                  <input
                    type="radio"
                    name="semester"
                    value={n}
                    checked={semester === String(n)}
                    onChange={(e) => setSemester(e.target.value)}
                    className="peer sr-only"
                    required
                  />
                  <span className="inline-flex min-h-12 cursor-pointer items-center rounded-full border-[3px] border-line bg-background px-5 font-extrabold text-foreground transition-[translate,box-shadow,background-color] hover:-translate-y-0.5 peer-checked:bg-sunflower peer-checked:text-ink peer-checked:shadow-[0_4px_0_0_var(--line)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
                    Semester {n}
                  </span>
                </label>
              ))}
              {AVAILABLE_SEMESTERS.length < 8 ? (
                <span className="text-sm text-muted-foreground">More semesters coming soon.</span>
              ) : null}
            </div>
            <FieldError id="semester-error" message={errors.semester} />
          </fieldset>
        ) : (
          <div>
            <Label htmlFor="semester">Current semester</Label>
            <Select
              id="semester"
              name="semester"
              className="mt-2"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              aria-invalid={Boolean(errors.semester)}
              aria-describedby={describedBy("semester")}
              required
            >
              <option value="" disabled>
                Choose semester
              </option>
              {AVAILABLE_SEMESTERS.map((n) => (
                <option key={n} value={n}>
                  Semester {n}
                </option>
              ))}
            </Select>
            <FieldError id="semester-error" message={errors.semester} />
          </div>
        )}
      </div>

      {mode === "onboarding" ? (
        <fieldset className="space-y-4 rounded-2xl bg-muted p-4">
          <legend className="sr-only">Confirmations</legend>
          <Checkbox
            name="ageConfirmed"
            defaultChecked={values.ageConfirmed}
            error={errors.ageConfirmed}
          >
            I am 18 or older, or I have my parent&apos;s or guardian&apos;s consent to use Modulr.
          </Checkbox>
          <Checkbox name="consent" defaultChecked={values.consent} error={errors.consent}>
            I agree to the{" "}
            <Link href="/terms" target="_blank" className="font-bold text-link underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" className="font-bold text-link underline">
              Privacy Policy
            </Link>
            , including the rule that accounts are personal and must not be shared.
          </Checkbox>
        </fieldset>
      ) : null}

      <div role="status" aria-live="polite">
        <FieldError id="form-error" message={errors.form} />
        {state.saved ? (
          <p className="flex items-center gap-2 text-sm font-bold">
            <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
            Saved
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        size="lg"
        variant={mode === "onboarding" ? "sunflower" : "primary"}
        block={mode === "onboarding"}
        disabled={pending}
      >
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        {mode === "onboarding" ? "Start learning" : "Save changes"}
        {mode === "onboarding" && !pending ? <ArrowRight aria-hidden="true" /> : null}
      </Button>
    </form>
  );
}

function Checkbox({
  name,
  defaultChecked,
  error,
  children,
}: {
  name: string;
  defaultChecked: boolean | undefined;
  error: string | undefined;
  children: ReactNode;
}) {
  const errorId = `${name}-error`;
  return (
    <div>
      <label htmlFor={name} className="flex items-start gap-3 text-sm leading-relaxed">
        <input
          id={name}
          name={name}
          type="checkbox"
          defaultChecked={defaultChecked}
          className="mt-0.5 size-6 shrink-0 accent-primary"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          required
        />
        <span>{children}</span>
      </label>
      <FieldError id={errorId} message={error} />
    </div>
  );
}
