"use client";

import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createContext,
  Fragment,
  startTransition,
  useActionState,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { IDLE, type ActionState } from "@/lib/admin/state";
import { cn } from "@/lib/utils";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

const FormState = createContext<ActionState>(IDLE);

/**
 * Form bound to an admin server action. Submits in a transition so React does
 * not reset the fields (typed input survives validation errors); optionally
 * clears itself after a successful create.
 */
export function ActionForm({
  action,
  children,
  submitLabel = "Save",
  submitVariant = "primary",
  resetOnSuccess = false,
  confirm,
  hideStatus = false,
  className,
  footer,
}: {
  action: Action;
  children?: ReactNode;
  submitLabel?: ReactNode;
  submitVariant?: ButtonProps["variant"];
  resetOnSuccess?: boolean;
  /** Asks for confirmation before submitting, e.g. for deletes. */
  confirm?: string;
  hideStatus?: boolean;
  className?: string;
  footer?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  const router = useRouter();
  // Remounting the fields clears both uncontrolled and controlled (stateful) inputs.
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (state.status !== "ok") return;
    if (state.redirectTo) router.push(state.redirectTo);
    else if (resetOnSuccess) setResetKey((k) => k + 1);
  }, [state.at, state.status, state.redirectTo, resetOnSuccess, router]);

  return (
    <FormState.Provider value={state}>
      <form
        action={formAction}
        onSubmit={(event) => {
          event.preventDefault();
          if (confirm && !window.confirm(confirm)) return;
          const data = new FormData(event.currentTarget);
          startTransition(() => formAction(data));
        }}
        className={cn("space-y-4", className)}
        noValidate
      >
        <Fragment key={resetKey}>{children}</Fragment>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant={submitVariant} size="sm" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            {submitLabel}
          </Button>
          {footer}
          {hideStatus ? null : <StatusMessage state={state} />}
        </div>
      </form>
    </FormState.Provider>
  );
}

export function StatusMessage({ state }: { state: ActionState }) {
  return (
    <p role="status" aria-live="polite" className="min-h-5 text-sm font-semibold">
      {state.status === "ok" ? (
        <span key={state.at} className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
          {state.message}
        </span>
      ) : state.status === "error" ? (
        <span key={state.at} className="inline-flex items-start gap-1.5 text-danger-text">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </span>
      ) : null}
    </p>
  );
}

export function useFieldError(name: string) {
  return useContext(FormState).fieldErrors?.[name];
}

interface FieldProps {
  name: string;
  label: string;
  hint?: ReactNode;
  className?: string;
}

function FieldShell({
  name,
  label,
  hint,
  className,
  children,
}: FieldProps & {
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}) {
  const error = useFieldError(name);
  const id = `field-${name}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      {hint ? (
        <p id={hintId} className="mt-0.5 text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <div className="mt-1.5">
        {children({
          id,
          describedBy: [hintId, errorId].filter(Boolean).join(" ") || undefined,
          invalid: Boolean(error),
        })}
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function TextField({
  name,
  label,
  hint,
  className,
  ...props
}: FieldProps & Omit<ComponentProps<"input">, "name" | "id">) {
  return (
    <FieldShell name={name} label={label} hint={hint} className={className}>
      {({ id, describedBy, invalid }) => (
        <Input
          id={id}
          name={name}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          {...props}
        />
      )}
    </FieldShell>
  );
}

export function TextAreaField({
  name,
  label,
  hint,
  className,
  mono = false,
  ...props
}: FieldProps & { mono?: boolean } & Omit<ComponentProps<"textarea">, "name" | "id">) {
  return (
    <FieldShell name={name} label={label} hint={hint} className={className}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          name={name}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={cn(
            "min-h-24 w-full rounded-xl border-2 border-input bg-background px-4 py-3 text-base focus-visible:border-ring focus-visible:outline-none aria-[invalid=true]:border-destructive",
            mono && "font-mono text-sm",
          )}
          {...props}
        />
      )}
    </FieldShell>
  );
}

export function SelectField({
  name,
  label,
  hint,
  className,
  options,
  ...props
}: FieldProps & {
  options: ReadonlyArray<{ value: string; label: string }>;
} & Omit<ComponentProps<"select">, "name" | "id">) {
  return (
    <FieldShell name={name} label={label} hint={hint} className={className}>
      {({ id, describedBy, invalid }) => (
        <Select
          id={id}
          name={name}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      )}
    </FieldShell>
  );
}

export function CheckboxField({
  name,
  label,
  hint,
  defaultChecked,
}: FieldProps & { defaultChecked?: boolean }) {
  const id = `field-${name}`;
  return (
    <div>
      <label htmlFor={id} className="flex min-h-11 items-center gap-3 text-sm font-bold">
        <input
          id={id}
          name={name}
          type="checkbox"
          defaultChecked={defaultChecked}
          className="size-5 shrink-0 accent-primary"
        />
        {label}
      </label>
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
