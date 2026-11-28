"use client";

import { useState, type ReactNode } from "react";
import type { ModuleCounts, ModuleTabId } from "@/lib/module-tabs";
import { ModuleTabsNav } from "./module-tabs-nav";

/**
 * The module page's tabs, switched in the browser. The server sends every tab's
 * content with the page (each streams in on its own), so changing tabs shows the
 * section at once instead of waiting on a server round trip. Only the open tab is
 * mounted, so a video stops when you leave its tab. The address bar follows along,
 * so reloading or sharing keeps the tab.
 */
export function InstantModuleTabs({
  basePath,
  initialTab,
  counts,
  hasCodeTab,
  panels,
}: {
  basePath: string;
  initialTab: ModuleTabId;
  counts: ModuleCounts | undefined;
  hasCodeTab: boolean;
  panels: Partial<Record<ModuleTabId, ReactNode>>;
}) {
  const [active, setActive] = useState(initialTab);

  function select(tab: ModuleTabId) {
    if (tab === active) return;
    setActive(tab);
    // Next's router picks up history.replaceState, so the URL and search params stay in sync.
    window.history.replaceState(null, "", tab === "videos" ? basePath : `${basePath}?tab=${tab}`);
  }

  return (
    <>
      <div className="mt-6">
        <ModuleTabsNav
          basePath={basePath}
          active={active}
          counts={counts}
          hasCodeTab={hasCodeTab}
          onSelect={select}
        />
      </div>
      <div className="mt-6">{panels[active]}</div>
    </>
  );
}
