"use client";

import { X } from "lucide-react";

interface ActiveFilter {
    key: string;
    label: string;
    value: string;
}

interface ActiveFiltersProps {
    filters: ActiveFilter[];
    onRemove: (key: string, value: string) => void;
    onClearAll: () => void;
    className?: string;
}

export default function ActiveFilters({ filters, onRemove, onClearAll, className = "" }: ActiveFiltersProps) {
    if (filters.length === 0) return null;

    return (
        <div className={`flex flex-wrap items-center gap-2 ${className}`}>
            {filters.map((filter) => (
                <button
                    key={`${filter.key}-${filter.value}`}
                    onClick={() => onRemove(filter.key, filter.value)}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                >
                    {filter.label}
                    <X className="h-3 w-3" />
                </button>
            ))}
            <button
                onClick={onClearAll}
                className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
                Clear all
            </button>
        </div>
    );
}
