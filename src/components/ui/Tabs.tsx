"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  children: React.ReactNode[];
  defaultTab?: string;
  className?: string;
  onTabChange?: (tabId: string) => void;
}

export function Tabs({ tabs, children, defaultTab, className, onTabChange }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);

  const activeIndex = tabs.findIndex((t) => t.id === active);

  const handleTabChange = (tabId: string) => {
    setActive(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Tab list */}
      <div className="flex gap-1 p-1 bg-slate-50 rounded-xl border border-slate-200 w-fit mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              active === tab.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel activo */}
      <div>{children[activeIndex]}</div>
    </div>
  );
}

