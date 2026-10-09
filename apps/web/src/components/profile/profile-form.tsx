"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import type { ProfileFormState, ProfileFormValues } from "@/lib/actions/profile";

export interface CollegeOption {
  id: string;
  name: string;
  branches: { id: string; name: string; code: string }[];
}

type Action = (state: ProfileFormState, formData: FormData) => Promise<ProfileFormState>;

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

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

  const [semester, setSemester] = useState(values.semester);

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
            {SEMESTERS.map((n) => (
              <option key={n} value={n}>
                Semester {n}
              </option>
            ))}
          </Select>
          <FieldError id="semester-error" message={errors.semester} />
        </div>
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

      <Button type="submit" size="lg" block={mode === "onboarding"} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        {mode === "onboarding" ? "Start learning" : "Save changes"}
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
