"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import { StatusMessage } from "@/components/admin/action-form";
import { Button } from "@/components/ui/button";
import { IDLE } from "@/lib/admin/state";
import { cancelSubscription } from "@/lib/billing/actions";

export function CancelSubscriptionButton() {
  const [state, action, pending] = useActionState(cancelSubscription, IDLE);
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const message =
          "Cancel your plan? You won't be charged again. You keep access for the period you've already paid for.";
        if (!window.confirm(message)) {
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
