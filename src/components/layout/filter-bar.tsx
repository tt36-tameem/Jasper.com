"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterBarProps {
  filters: FilterOption[];
  defaultFilter?: string;
  onFilterChange?: (id: string) => void;
  className?: string;
}

export function FilterBar({
  filters,
  defaultFilter,
  onFilterChange,
  className,
}: FilterBarProps) {
  const [active, setActive] = useState(defaultFilter ?? filters[0]?.id);

  function handleSelect(id: string) {
    setActive(id);
    onFilterChange?.(id);
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none",
        className
      )}
    >
      {filters.map((f) => (
        <Button
          key={f.id}
          variant={active === f.id ? "pill-active" : "pill"}
          size="pill"
          onClick={() => handleSelect(f.id)}
          className="flex-shrink-0"
        >
          {f.label}
          {f.count !== undefined && (
            <span
              className={cn(
                "ml-1 tabular-nums",
                active === f.id ? "text-white/70" : "text-zinc-400"
              )}
            >
              {f.count}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
