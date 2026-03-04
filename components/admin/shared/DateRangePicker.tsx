"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
    from?: string;
    to?: string;
    onChange: (range: { from: string; to: string }) => void;
    className?: string;
}

export default function DateRangePicker({ from = "", to = "", onChange, className }: DateRangePickerProps) {
    const [localFrom, setLocalFrom] = useState(from);
    const [localTo, setLocalTo] = useState(to);

    function handleApply() {
        onChange({ from: localFrom, to: localTo });
    }

    function handleClear() {
        setLocalFrom("");
        setLocalTo("");
        onChange({ from: "", to: "" });
    }

    return (
        <div className={cn("flex items-center gap-2 flex-wrap", className)}>
            <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
                type="date"
                value={localFrom}
                onChange={e => setLocalFrom(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-2 text-xs outline-none focus:border-[#FF6B35]"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
                type="date"
                value={localTo}
                onChange={e => setLocalTo(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-2 text-xs outline-none focus:border-[#FF6B35]"
            />
            <button
                onClick={handleApply}
                className="rounded-lg bg-[#FF6B35] px-3 py-1 text-xs font-semibold text-white hover:bg-[#e55a24] transition"
            >
                Apply
            </button>
            {(localFrom || localTo) && (
                <button onClick={handleClear} className="text-xs text-muted-foreground hover:text-foreground transition">Clear</button>
            )}
        </div>
    );
}
