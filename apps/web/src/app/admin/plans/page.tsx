import { ActionForm, CheckboxField, TextField } from "@/components/admin/action-form";
import { AdminSection, Disclosure, EmptyState } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { adminMetadata } from "@/lib/admin/metadata";
import { savePlan } from "@/lib/admin/plan-actions";
import { paymentsConfigured } from "@/lib/billing";
import { formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const generateMetadata = adminMetadata("Plans");

function PlanFields({
  plan,
}: {
  plan?: {
    name: string;
    description: string | null;
    price_paise: number;
    sort_order: number;
    is_active: boolean;
  };
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="name" label="Name" defaultValue={plan?.name ?? "Monthly"} />
        <TextField
          name="price_rupees"
          label="Price per month (₹)"
          inputMode="numeric"
          defaultValue={plan ? String(plan.price_paise / 100) : "100"}
          hint="Changing it creates a new Razorpay plan; current subscribers keep their price."
        />
        <TextField
          name="description"
          label="Description"
          defaultValue={plan?.description ?? ""}
          className="sm:col-span-2"
        />
        <TextField
          name="sort_order"
          label="Order on the pricing page"
          inputMode="numeric"
          defaultValue={String(plan?.sort_order ?? 1)}
        />
      </div>
      <CheckboxField
        name="is_active"
        label="Show on the pricing page and allow new subscriptions"
        defaultChecked={plan?.is_active ?? true}
      />
    </>
  );
}

export default async function PlansPage() {
  const supabase = await createClient();
  const { data: plans, error } = await supabase
    .from("plans")
    .select("id, name, description, price_paise, interval, sort_order, is_active, razorpay_plan_id")
    .order("sort_order")
    .order("price_paise");
  if (error) throw new Error(`Couldn't load plans: ${error.message}`);
  const configured = paymentsConfigured();

  return (
    <>
      <div>
        <h1 className="text-3xl">Plans</h1>
        <p className="mt-2 max-w-prose text-muted-foreground">
          Monthly subscriptions paid through Razorpay (UPI Autopay and cards). Saving a plan creates
          it in Razorpay when needed.
        </p>
      </div>

      {!configured ? (
        <p className="rounded-2xl bg-sunflower/30 p-4 text-sm font-semibold">
          Razorpay isn&apos;t configured on this server. Set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
          and RAZORPAY_WEBHOOK_SECRET, restart, then save each plan to create it in Razorpay.
        </p>
      ) : null}

      <AdminSection title="All plans">
        {plans.length === 0 ? <EmptyState>No plans yet. Add one below.</EmptyState> : null}
        <ul className="space-y-3">
          {plans.map((plan) => (
            <li key={plan.id} className="space-y-2 rounded-2xl border-2 bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">
                  {plan.name}{" "}
                  <span className="font-normal text-muted-foreground">
                    · {formatPrice(plan.price_paise)}
                    {plan.interval === "month" ? "/month" : " one-time"}
                  </span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={plan.is_active ? "free" : "neutral"}>
                    {plan.is_active ? "Active" : "Hidden"}
                  </Badge>
                  <Badge variant={plan.razorpay_plan_id ? "primary" : "highlight"}>
                    {plan.razorpay_plan_id ? "In Razorpay" : "Not in Razorpay yet"}
                  </Badge>
                </div>
              </div>
              {plan.razorpay_plan_id ? (
                <p className="font-mono text-sm text-muted-foreground">{plan.razorpay_plan_id}</p>
              ) : null}
              {plan.interval === "month" ? (
                <Disclosure summary="Edit plan">
                  <ActionForm action={savePlan}>
                    <input type="hidden" name="id" value={plan.id} />
                    <PlanFields plan={plan} />
                    <CheckboxField
                      name="new_provider_plan"
                      label="Create a new Razorpay plan"
                      hint="Needed after switching from test keys to live keys."
                    />
                  </ActionForm>
                </Disclosure>
              ) : (
                <p className="text-sm text-muted-foreground">
                  One-time plans can&apos;t be sold yet.
                </p>
              )}
            </li>
          ))}
        </ul>
      </AdminSection>

      <Disclosure summary="+ Add a plan">
        <ActionForm action={savePlan} submitLabel="Create plan" resetOnSuccess>
          <PlanFields />
        </ActionForm>
      </Disclosure>
    </>
  );
}
