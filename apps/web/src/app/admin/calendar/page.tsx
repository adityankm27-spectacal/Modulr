import { AdminSection, EmptyState } from "@/components/admin/admin-ui";
import { CalendarImport } from "@/components/admin/calendar-import";
import { DeleteButton } from "@/components/admin/delete-button";
import { Badge } from "@/components/ui/badge";
import { adminMetadata } from "@/lib/admin/metadata";
import { deleteCalendarEvent } from "@/lib/admin/calendar-actions";
import { getCollegesWithBranches } from "@/lib/catalog";
import { formatRange } from "@/lib/planner/dates";
import { createClient } from "@/lib/supabase/server";

export const generateMetadata = adminMetadata("College calendar");

export default async function AdminCalendarPage() {
  const supabase = await createClient();
  const [colleges, events] = await Promise.all([
    getCollegesWithBranches(),
    supabase
      .from("calendar_events")
      .select("id, title, kind, starts_on, ends_on, semester, colleges(short_code), branches(code)")
      .not("college_id", "is", null)
      .order("starts_on", { ascending: false })
      .limit(300),
  ]);
  if (events.error) throw new Error(`Couldn't load events: ${events.error.message}`);

  return (
    <>
      <div>
        <h1 className="text-3xl">College calendar</h1>
        <p className="mt-2 max-w-prose text-muted-foreground">
          Exams, holidays and deadlines that show on the calendar of every subscribed student at the
          chosen college. Students can add their own events but can&apos;t change these.
        </p>
      </div>

      <AdminSection title="Import a calendar">
        <CalendarImport
          colleges={colleges.map((c) => ({
            id: c.id,
            name: c.name,
            branches: c.branches.map((b) => ({ id: b.id, name: b.name })),
          }))}
        />
      </AdminSection>

      <AdminSection title="Events" description="Newest first. Showing up to 300.">
        {events.data.length === 0 ? (
          <EmptyState>No college events yet. Import a calendar above.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {events.data.map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 bg-card p-3"
              >
                <div className="min-w-0">
                  <p className="font-bold">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatRange(event.starts_on, event.ends_on)} ·{" "}
                    {event.colleges?.short_code ?? "College"} ·{" "}
                    {event.branches?.code ?? "all branches"} ·{" "}
                    {event.semester ? `semester ${event.semester}` : "all semesters"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="neutral">{event.kind}</Badge>
                  <DeleteButton
                    action={deleteCalendarEvent}
                    fields={{ id: event.id }}
                    what={`"${event.title}"`}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminSection>
    </>
  );
}
