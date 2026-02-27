"use client";

import { LayoutGrid, List, Map } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "list" | "map";

interface ViewToggleProps {
    current: ViewMode;
    onChange: (mode: ViewMode) => void;
    className?: string;
}

const views: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
    { mode: "grid", icon: LayoutGrid, label: "Grid view" },
    { mode: "list", icon: List, label: "List view" },
    { mode: "map", icon: Map, label: "Map view" },
];

export default function ViewToggle({ current, onChange, className }: ViewToggleProps) {
    return (
        <div className={cn("inline-flex rounded-lg border border-border bg-card p-0.5", className)}>
            {views.map(({ mode, icon: Icon, label }) => (
                <button
                    key={mode}
                    onClick={() => onChange(mode)}
                    aria-label={label}
                    className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
                        current === mode
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                >
                    <Icon className="h-4 w-4" />
                </button>
            ))}
        </div>
    );
}
