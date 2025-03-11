"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";

interface AnimatedTabsProps {
  tabs: string[];
  defaultIndex?: number;
  onChange?: (index: number) => void;
  className?: string;
}

export function AnimatedTabs({
  tabs,
  defaultIndex = 0,
  onChange,
  className,
}: AnimatedTabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultIndex);
  const [indicatorStyle, setIndicatorStyle] = React.useState({
    left: 0,
    width: 0,
  });
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  // Mettre à jour la position de l'indicateur lorsque l'onglet actif change
  React.useEffect(() => {
    const currentTab = tabRefs.current[activeTab];
    if (currentTab) {
      setIndicatorStyle({
        left: currentTab.offsetLeft,
        width: currentTab.offsetWidth,
      });
    }
  }, [activeTab, tabs]);

  // Gérer le changement d'onglet
  const handleTabClick = (index: number) => {
    setActiveTab(index);
    if (onChange) {
      onChange(index);
    }
  };

  return (
    <div className={cn("relative border-b", className)}>
      <div className="flex" role="tablist">
        {tabs.map((tab, index) => (
          <button
            key={index}
            ref={(el: HTMLButtonElement | null) => {
              tabRefs.current[index] = el;
            }}
            onClick={() => handleTabClick(index)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors cursor-pointer",
              activeTab === index
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            role="tab"
            aria-selected={activeTab === index}
          >
            {tab}
          </button>
        ))}
      </div>
      <div
        className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300 ease-in-out"
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
        }}
      />
    </div>
  );
}

interface AnimatedTabsContentProps {
  value: number;
  index: number;
  className?: string;
  children: React.ReactNode;
}

export function AnimatedTabsContent({
  value,
  index,
  className,
  children,
}: AnimatedTabsContentProps) {
  const isActive = value === index;

  return (
    <div
      role="tabpanel"
      aria-hidden={!isActive}
      className={cn(
        "transition-opacity duration-300 ease-in-out",
        isActive ? "opacity-100" : "absolute opacity-0 pointer-events-none",
        className,
      )}
    >
      {children}
    </div>
  );
}
