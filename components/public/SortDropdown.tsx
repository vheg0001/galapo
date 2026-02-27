"use client";

import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortOption = "featured" | "newest" | "name_asc" | "name_desc";

interface SortDropdownProps {
    current: SortOption;
    onChange: (sort: SortOption) => void;
    className?: string;
}

const options: { value: SortOption; label: string }[] = [
    { value: "featured", label: "Featured First" },
    { value: "newest", label: "Newest" },
    { value: "name_asc", label: "Name A–Z" },
    { value: "name_desc", label: "Name Z–A" },
];

export default function SortDropdown({ current, onChange, className }: SortDropdownProps) {
    return (
        <div className={cn("relative inline-flex items-center gap-2", className)}>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
                value={current}
                onChange={(e) => onChange(e.target.value as SortOption)}
                className="h-9 cursor-pointer appearance-none rounded-lg border border-border bg-card px-3 pr-8 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
