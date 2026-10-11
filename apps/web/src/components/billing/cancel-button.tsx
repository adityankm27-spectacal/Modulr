"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import { StatusMessage } from "@/components/admin/action-form";
import { Button } from "@/components/ui/button";
import { IDLE } from "@/lib/admin/state";
import { cancelSubscription } from "@/lib/billing/actions";

export function CancelSubscriptionButton({ accessUntil }: { accessUntil: string | null }) {
  const [state, action, pending] = useActionState(cancelSubscription, IDLE);
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const until = accessUntil ? ` You keep access until ${accessUntil}.` : "";
        if (!window.confirm(`Cancel your plan? You won't be charged again.${until}`)) {
          event.preventDefault();
        }
      }}
      className="flex flex-wrap items-center gap-3"
    >
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        Cancel plan
      </Button>
      <StatusMessage state={state} />
    </form>
  );
}
