import type { CalendarEventKind, ModuleStep } from "@modulr/shared";

export interface PlannerEvent {
  id: string;
  title: string;
  kind: CalendarEventKind;
  starts_on: string;
  ends_on: string | null;
  notes: string | null;
  /** College events come from the admins and can't be changed by students. */
  scope: "college" | "personal";
}

export interface PlannerTodo {
  id: string;
  title: string;
  module_id: string | null;
  due_on: string | null;
  done: boolean;
}

export interface PlannerModule {
  id: string;
  number: number;
  title: string;
  subjectId: string;
  subjectName: string;
}

/** Module id → the steps the student has ticked. */
export type PlannerSteps = Record<string, ModuleStep[]>;

export interface PlannerData {
  events: PlannerEvent[];
  todos: PlannerTodo[];
  modules: PlannerModule[];
  steps: PlannerSteps;
}

export type PlannerResult = { ok: true } | { ok: false; error: string };
