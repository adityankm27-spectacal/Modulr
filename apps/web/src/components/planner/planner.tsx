import { CalendarDays, Lock } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import type { PlannerData } from "@/lib/planner/types";
import { cn } from "@/lib/utils";
import { PlannerCalendar } from "./calendar";
import { plannerCard } from "./kinds";

/** The study planner shown beside the subjects on the home page. */
export function Planner({ data }: { data: PlannerData }) {
  return (
    <div className="space-y-6">
      <PlannerCalendar events={data.events} />
    </div>
  );
}

/** What students without a plan see in the planner's place. */
export function PlannerLocked() {
  return (
    <section aria-labelledby="planner-locked-heading" className={cn(plannerCard, "space-y-3")}>
      <span className="flex size-12 items-center justify-center rounded-2xl border-[3px] border-line bg-sunflower text-ink">
        <Lock className="size-6" aria-hidden="true" />
      </span>
      <h2 id="planner-locked-heading" className="font-sans text-lg font-extrabold tracking-normal">
        Your study planner
      </h2>
      <ul className="space-y-2 text-sm">
        <li className="flex items-start gap-2">
          <CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden="true" />A calendar with your
          college&apos;s exams and holidays, and your own dates
        </li>
      </ul>
      <Link href="/pricing" className={buttonVariants({ variant: "sunflower", block: true })}>
        Subscribe to unlock
      </Link>
    </section>
  );
}

/** Shown if the planner's data couldn't be loaded; the rest of the page still works. */
export function PlannerUnavailable() {
  return (
    <section aria-labelledby="planner-unavailable-heading" className={cn(plannerCard, "space-y-2")}>
      <h2
        id="planner-unavailable-heading"
        className="font-sans text-lg font-extrabold tracking-normal"
      >
        Your study planner
      </h2>
      <p className="text-muted-foreground">
        The planner couldn&apos;t load right now. Refresh the page in a moment.
      </p>
    </section>
  );
}
