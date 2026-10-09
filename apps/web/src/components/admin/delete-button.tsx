"use client";

import { Trash2 } from "lucide-react";
import { ActionForm } from "@/components/admin/action-form";
import type { ActionState } from "@/lib/admin/state";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

/** Delete with a confirmation prompt. Extra hidden fields identify the row. */
export function DeleteButton({
  action,
  fields,
  what,
}: {
  action: Action;
  fields: Record<string, string>;
  /** e.g. "this module" — used in the confirmation prompt. */
  what: string;
}) {
  return (
    <ActionForm
      action={action}
      confirm={`Delete ${what}? This can't be undone.`}
      submitLabel={
        <>
          <Trash2 aria-hidden="true" />
          Delete
        </>
      }
      submitVariant="ghost"
      className="space-y-0"
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
    </ActionForm>
  );
}
