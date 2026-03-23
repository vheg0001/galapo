"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — OperatingHoursEditor Component (Module 9.1)
// 7-day table with time pickers and closed toggles
// ──────────────────────────────────────────────────────────

import type { OperatingHours, DayHours } from "@/lib/types";
import { Copy, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type Day = keyof OperatingHours;

const DAYS: { key: Day; label: string; short: string }[] = [
    { key: "monday", label: "Monday", short: "Mon" },
    { key: "tuesday", label: "Tuesday", short: "Tue" },
    { key: "wednesday", label: "Wednesday", short: "Wed" },
    { key: "thursday", label: "Thursday", short: "Thu" },
    { key: "friday", label: "Friday", short: "Fri" },
    { key: "saturday", label: "Saturday", short: "Sat" },
    { key: "sunday", label: "Sunday", short: "Sun" },
];

interface OperatingHoursEditorProps {
    value: OperatingHours;
    onChange: (hours: OperatingHours) => void;
}

export default function OperatingHoursEditor({ value, onChange }: OperatingHoursEditorProps) {
    const update = (day: Day, patch: Partial<DayHours>) => {
        const currentDay = value?.[day] || { open: "08:00", close: "17:00", closed: false };
        const newValue = {
            ...(value || {}),
            [day]: { ...currentDay, ...patch }
        } as OperatingHours;
        onChange(newValue);
    };

    const copyMondayToAll = () => {
        const monday = value.monday;
        const updated = { ...value };
        DAYS.forEach(({ key }) => { updated[key] = { ...monday }; });
        onChange(updated);
    };

    return (
        <div className="space-y-3">
            {/* Copy Monday button */}
            <div className="flex justify-end pr-1">
                <button
                    type="button"
                    onClick={copyMondayToAll}
                    className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all active:scale-95 shadow-sm"
                >
                    <Copy size={12} className="opacity-70" />
                    Copy Monday content to all days
                </button>
            </div>

            {/* Days table */}
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-background/30 shadow-sm ring-1 ring-border/40">
                <div className="hidden sm:grid grid-cols-[130px_1fr_1fr_100px] items-center gap-4 border-b border-border/40 bg-muted/20 px-6 py-3 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">
                    <span>Day</span>
                    <span className="text-center">Opens</span>
                    <span className="text-center">Closes</span>
                    <span className="text-right">Status</span>
                </div>

                <div className="divide-y divide-border/30">
                    {DAYS.map(({ key, label, short }) => {
                        const day = value[key] || { open: "08:00", close: "17:00", closed: false };
                        return (
                            <div
                                key={key}
                                className={cn(
                                    "grid grid-cols-1 sm:grid-cols-[130px_1fr_1fr_100px] items-center gap-4 px-4 sm:px-6 py-3.5 transition-all duration-200",
                                    day.closed ? "bg-muted/20 opacity-60" : "bg-transparent hover:bg-muted/5"
                                )}
                            >
                                {/* Day name */}
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "h-1.5 w-1.5 rounded-full shrink-0",
                                        day.closed ? "bg-muted-foreground/30" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                    )} />
                                    <span className="text-xs font-bold text-foreground tracking-tight truncate">
                                        <span className="sm:hidden">{label}</span>
                                        <span className="hidden sm:inline">{label}</span>
                                    </span>
                                </div>

                                {/* Open time */}
                                <div className="space-y-1 sm:space-y-0 relative">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 sm:hidden ml-1">Opens</p>
                                    <div className="relative group">
                                        <input
                                            type="time"
                                            value={day.open}
                                            disabled={day.closed}
                                            onChange={(e) => update(key, { open: e.target.value })}
                                            className="w-full rounded-2xl border border-border/60 bg-background pl-3 pr-8 py-2 text-sm font-bold text-foreground disabled:cursor-not-allowed disabled:bg-muted/20 disabled:text-muted-foreground/30 transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-sm appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
                                        />
                                        <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none group-focus-within:text-primary/60 transition-colors" />
                                    </div>
                                </div>

                                {/* Close time */}
                                <div className="space-y-1 sm:space-y-0 relative">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 sm:hidden ml-1">Closes</p>
                                    <div className="relative group">
                                        <input
                                            type="time"
                                            value={day.close}
                                            disabled={day.closed}
                                            onChange={(e) => update(key, { close: e.target.value })}
                                            className="w-full rounded-2xl border border-border/60 bg-background pl-3 pr-8 py-2 text-sm font-bold text-foreground disabled:cursor-not-allowed disabled:bg-muted/20 disabled:text-muted-foreground/30 transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-sm appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
                                        />
                                        <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none group-focus-within:text-primary/60 transition-colors" />
                                    </div>
                                </div>

                                {/* Closed toggle */}
                                <div className="flex items-center justify-end">
                                    <button
                                        type="button"
                                        onClick={() => update(key, { closed: !day.closed })}
                                        className={cn(
                                            "flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 transition-all active:scale-95 shadow-sm min-w-[75px] justify-center",
                                            day.closed
                                                ? "border-red-500/20 bg-red-500/5 text-red-600/70 hover:bg-red-500/10"
                                                : "border-emerald-500/20 bg-emerald-500/5 text-emerald-600/70 hover:bg-emerald-500/10"
                                        )}
                                    >
                                        <span className="text-[9px] font-black uppercase tracking-widest">
                                            {day.closed ? "Closed" : "Open"}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
