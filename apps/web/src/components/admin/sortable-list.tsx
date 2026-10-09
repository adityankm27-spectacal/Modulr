"use client";

import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { useState, useTransition, type DragEvent, type ReactNode } from "react";
import { StatusMessage } from "@/components/admin/action-form";
import { reorder } from "@/lib/admin/actions";
import type { ReorderableTable } from "@/lib/admin/schemas";
import { IDLE, type ActionState } from "@/lib/admin/state";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  /** Accessible name used by the move buttons, e.g. "Module 2". */
  label: string;
  content: ReactNode;
}

function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  if (item !== undefined) next.splice(to, 0, item);
  return next;
}

/**
 * Drag-to-reorder list (spec §5.6). Drag the handle with a mouse, or use the
 * up/down buttons (keyboard and touch). Saves the new order immediately and
 * rolls back if the save fails.
 */
export function SortableList({
  table,
  items: initial,
}: {
  table: ReorderableTable;
  items: Item[];
}) {
  // Only the order lives in state; content always comes from the latest props, so
  // server updates (e.g. a publish toggle) are never hidden behind a stale copy.
  const serverOrder = initial.map((i) => i.id);
  const [order, setOrder] = useState(serverOrder);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [state, setState] = useState<ActionState>(IDLE);
  const [pending, startTransition] = useTransition();

  // Items added or removed on the server: adopt the server's order.
  const serverKey = [...serverOrder].sort().join(",");
  const [lastKey, setLastKey] = useState(serverKey);
  if (serverKey !== lastKey) {
    setLastKey(serverKey);
    setOrder(serverOrder);
  }

  const byId = new Map(initial.map((i) => [i.id, i]));
  const items = order.flatMap((id) => byId.get(id) ?? []);

  const commit = (next: Item[]) => {
    const previous = order;
    const ids = next.map((i) => i.id);
    setOrder(ids);
    startTransition(async () => {
      const result = await reorder(table, ids);
      setState(result);
      if (result.status === "error") setOrder(previous);
    });
  };

  const onDrop = (event: DragEvent, to: number) => {
    event.preventDefault();
    if (dragging !== null && dragging !== to) commit(move(items, dragging, to));
    setDragging(null);
    setOver(null);
  };

  return (
    <div>
      <ol className="space-y-2" aria-busy={pending}>
        {items.map((item, index) => (
          <li
            key={item.id}
            onDragOver={(event) => {
              if (dragging === null) return;
              event.preventDefault();
              setOver(index);
            }}
            onDragLeave={() => setOver((o) => (o === index ? null : o))}
            onDrop={(event) => onDrop(event, index)}
            className={cn(
              "flex items-stretch gap-2 rounded-2xl border-2 bg-card transition-colors",
              dragging === index && "opacity-50",
              over === index && dragging !== index && "border-primary",
            )}
          >
            <span
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", item.id);
                setDragging(index);
              }}
              onDragEnd={() => {
                setDragging(null);
                setOver(null);
              }}
              className="hidden cursor-grab items-center pl-2 text-muted-foreground active:cursor-grabbing sm:flex"
              title="Drag to reorder"
              aria-hidden="true"
            >
              <GripVertical className="size-5" />
            </span>
            <div className="min-w-0 flex-1 py-3 pl-3 sm:pl-0">{item.content}</div>
            <div className="flex flex-col justify-center border-l">
              <button
                type="button"
                onClick={() => commit(move(items, index, index - 1))}
                disabled={index === 0 || pending}
                aria-label={`Move ${item.label} up`}
                className="flex size-10 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ArrowUp className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => commit(move(items, index, index + 1))}
                disabled={index === items.length - 1 || pending}
                aria-label={`Move ${item.label} down`}
                className="flex size-10 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ArrowDown className="size-4" aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-2">
        <StatusMessage state={state} />
      </div>
    </div>
  );
}
