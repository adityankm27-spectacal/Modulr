"use client";

import {
  CodeXml,
  FileText,
  History,
  MessageCircleQuestion,
  PlayCircle,
  Presentation,
  Sigma,
  Star,
} from "lucide-react";
import NextLink from "next/link";
import { IntentLink } from "@/components/intent-link";
import { moduleTabs, tabCount, type ModuleCounts, type ModuleTabId } from "@/lib/module-tabs";
import { cn } from "@/lib/utils";
import { TabPending } from "./tab-pending";
import { TabStrip } from "./tab-strip";

const ICONS: Record<ModuleTabId, typeof PlayCircle> = {
  videos: PlayCircle,
  code: CodeXml,
  notes: FileText,
  slides: Presentation,
  formulas: Sigma,
  pyqs: History,
  important: Star,
  viva: MessageCircleQuestion,
};

export function ModuleTabsNav({
  basePath,
  active,
  counts,
  hasCodeTab = false,
  onSelect,
}: {
  basePath: string;
  active: ModuleTabId;
  counts: ModuleCounts | undefined;
  /** Show the Code tab (subjects that turned it on, e.g. Data Structures). */
  hasCodeTab?: boolean;
  /**
   * Switch tabs in the browser instead of loading a new page (the module page sends
   * every tab's content up front). Ctrl/Cmd-click still opens the tab's own URL.
   */
  onSelect?: (tab: ModuleTabId) => void;
}) {
  // Instant tabs never ask the server, so they don't load anything ahead on hover.
  const Link = onSelect ? NextLink : IntentLink;
  return (
    <TabStrip label="Module sections">
      <ul className="flex min-w-max gap-2 border-b pt-1 pb-4">
        {moduleTabs({ hasCodeTab }).map((tab) => {
          const Icon = ICONS[tab.id];
          const isActive = tab.id === active;
          const count = tabCount(tab.id, counts);
          return (
            <li key={tab.id}>
              <Link
                href={tab.id === "videos" ? basePath : `${basePath}?tab=${tab.id}`}
                scroll={false}
                prefetch={false}
                data-instant-tab={onSelect ? "" : undefined}
                onClick={(event) => {
                  if (!onSelect || event.button !== 0) return;
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                  event.preventDefault();
                  onSelect(tab.id);
                }}
                // Switching tabs replaces the history entry, so Back leaves the module.
                replace
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group relative flex min-h-11 items-center gap-2 rounded-full border-[3px] px-4 text-sm font-bold transition-[translate,box-shadow,background-color,border-color,color] duration-200 active:translate-y-0.5 [&_svg]:size-4 [&_svg]:transition-transform [&_svg]:duration-300 hover:[&_svg]:-rotate-12 hover:[&_svg]:scale-125",
                  isActive
                    ? "border-line bg-cobalt text-white shadow-[0_4px_0_0_var(--line)]"
                    : "border-transparent bg-muted text-muted-foreground hover:-translate-y-0.5 hover:border-line hover:bg-card hover:text-foreground hover:shadow-[0_4px_0_0_var(--line)]",
                )}
              >
                <TabPending />
                <Icon aria-hidden="true" />
                {tab.label}
                {count > 0 ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 font-mono text-xs",
                      isActive ? "bg-white/25" : "bg-background",
                    )}
                  >
                    {count}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </TabStrip>
  );
}
