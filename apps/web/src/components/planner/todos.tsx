"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useOptimistic, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { addTodo, deleteTodo, setTodoDone } from "@/lib/planner/actions";
import { formatRange, isOverdue, toISODate } from "@/lib/planner/dates";
import type { PlannerModule, PlannerTodo } from "@/lib/planner/types";
import { cn } from "@/lib/utils";
import { plannerCard, smallField } from "./kinds";

type Change =
  | { type: "add"; todo: PlannerTodo }
  | { type: "done"; id: string; done: boolean }
  | { type: "remove"; id: string };

function apply(state: PlannerTodo[], change: Change): PlannerTodo[] {
  switch (change.type) {
    case "add":
      return [change.todo, ...state];
    case "done":
      return state.map((t) => (t.id === change.id ? { ...t, done: change.done } : t));
    case "remove":
      return state.filter((t) => t.id !== change.id);
  }
}

export function PlannerTodos({
  todos,
  modules,
}: {
  todos: PlannerTodo[];
  modules: PlannerModule[];
}) {
  const [items, change] = useOptimistic(todos, apply);
  const [title, setTitle] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => setToday(toISODate(new Date())), []);

  const moduleLabel = useMemo(
    () => new Map(modules.map((m) => [m.id, `${m.subjectName} · M${m.number}`])),
    [modules],
  );
  const subjects = useMemo(() => {
    const groups = new Map<string, { name: string; modules: PlannerModule[] }>();
    for (const m of modules) {
      const group = groups.get(m.subjectId) ?? { name: m.subjectName, modules: [] };
      group.modules.push(m);
      groups.set(m.subjectId, group);
    }
    return [...groups.values()];
  }, [modules]);

  const open = items
    .filter((t) => !t.done)
    .sort((a, b) => (a.due_on ?? "9999").localeCompare(b.due_on ?? "9999"));
  const done = items.filter((t) => t.done);

  const run = (promise: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const result = await promise();
      setError(result.ok ? null : (result.error ?? "Something went wrong."));
    });

  const submit = () => {
    const text = title.trim();
    if (!text) {
      setError("Write the task first.");
      return;
    }
    const todo: PlannerTodo = {
      id: `new-${Date.now()}`,
      title: text,
      module_id: moduleId || null,
      due_on: dueOn || null,
      done: false,
    };
    setTitle("");
    setDueOn("");
    run(async () => {
      change({ type: "add", todo });
      return addTodo({ title: text, moduleId: moduleId || null, dueOn: dueOn || null });
    });
  };

  const row = (todo: PlannerTodo) => (
    <li key={todo.id} className="flex items-start gap-3 rounded-xl bg-muted/60 p-3">
      <input
        type="checkbox"
        checked={todo.done}
        onChange={(e) =>
          run(async () => {
            change({ type: "done", id: todo.id, done: e.target.checked });
            return setTodoDone({ id: todo.id, done: e.target.checked });
          })
        }
        aria-label={`Mark "${todo.title}" as ${todo.done ? "not done" : "done"}`}
        className="mt-0.5 size-5 shrink-0 accent-primary"
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn("font-bold break-words", todo.done && "text-muted-foreground line-through")}
        >
          {todo.title}
        </p>
        <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs font-bold text-muted-foreground">
          {todo.module_id && moduleLabel.get(todo.module_id) ? (
            <span>{moduleLabel.get(todo.module_id)}</span>
          ) : null}
          {todo.due_on ? (
            <span
              className={cn(
                !todo.done && today && isOverdue(todo.due_on, today) && "text-danger-text",
              )}
            >
              Due {formatRange(todo.due_on, null)}
              {!todo.done && today && isOverdue(todo.due_on, today) ? " (overdue)" : ""}
            </span>
          ) : null}
        </p>
      </div>
      <button
        type="button"
        onClick={() =>
          run(async () => {
            change({ type: "remove", id: todo.id });
            return deleteTodo({ id: todo.id });
          })
        }
        aria-label={`Delete "${todo.title}"`}
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-danger-text hover:bg-muted"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </li>
  );

  return (
    <section aria-labelledby="todo-heading" className={cn(plannerCard, "space-y-3")}>
      <h2 id="todo-heading" className="font-sans text-lg font-extrabold tracking-normal">
        To-do
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-2"
      >
        <input
          className={smallField}
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Solve 5 queue problems"
          aria-label="New task"
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            className={smallField}
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            aria-label="Module (optional)"
          >
            <option value="">Any module</option>
            {subjects.map((subject) => (
              <optgroup key={subject.name} label={subject.name}>
                {subject.modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    Module {m.number}: {m.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <input
            type="date"
            className={smallField}
            value={dueOn}
            onChange={(e) => setDueOn(e.target.value)}
            aria-label="Due date (optional)"
          />
        </div>
        <Button type="submit" size="sm" variant="outline" block>
          <Plus aria-hidden="true" />
          Add task
        </Button>
      </form>

      <p role="status" aria-live="polite" className="min-h-5 text-sm font-bold text-danger-text">
        {error}
      </p>

      {open.length === 0 && done.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tasks yet. Add the first one above.</p>
      ) : null}
      {open.length ? <ul className="space-y-2">{open.map(row)}</ul> : null}
      {done.length ? (
        <details className="group">
          <summary className="min-h-9 cursor-pointer text-sm font-bold text-muted-foreground">
            Done ({done.length})
          </summary>
          <ul className="mt-2 space-y-2">{done.map(row)}</ul>
        </details>
      ) : null}
    </section>
  );
}
