"use client";

import { useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSearchInputProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
}

export default function AdminSearchInput({ value, onChange, placeholder = "Search...", className }: AdminSearchInputProps) {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = e.target.value;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            onChange(val);
        }, 300);
    }

    return (
        <div className={cn("relative flex items-center", className)}>
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <input
                key={value === "" ? "reset" : "active"}
                defaultValue={value}
                onChange={handleChange}
                placeholder={placeholder}
                className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-8 text-sm outline-none ring-0 transition focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/30"
            />
            {value && (
                <button
                    onClick={() => onChange("")}
                    className="absolute right-2.5 text-muted-foreground hover:text-foreground"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
}
