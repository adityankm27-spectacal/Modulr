import { FileText, History, MessageCircleQuestion, PlayCircle, Sigma, Star } from "lucide-react";
import Link from "next/link";
import { MODULE_TABS, tabCount, type ModuleCounts, type ModuleTabId } from "@/lib/module-tabs";
import { cn } from "@/lib/utils";
import { TabStrip } from "./tab-strip";

const ICONS: Record<ModuleTabId, typeof PlayCircle> = {
  videos: PlayCircle,
  notes: FileText,
  formulas: Sigma,
  pyqs: History,
  important: Star,
  viva: MessageCircleQuestion,
};

export function ModuleTabsNav({
  basePath,
  active,
  counts,
}: {
  basePath: string;
  active: ModuleTabId;
  counts: ModuleCounts | undefined;
}) {
  return (
    <TabStrip label="Module sections">
      <ul className="flex min-w-max gap-2 border-b pb-3">
        {MODULE_TABS.map((tab) => {
          const Icon = ICONS[tab.id];
          const isActive = tab.id === active;
          const count = tabCount(tab.id, counts);
          return (
            <li key={tab.id}>
              <Link
                href={tab.id === "videos" ? basePath : `${basePath}?tab=${tab.id}`}
                scroll={false}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors [&_svg]:size-4",
                  isActive
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon aria-hidden="true" />
                {tab.label}
                {count > 0 ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 font-mono text-xs",
                      isActive ? "bg-background/20" : "bg-background",
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
