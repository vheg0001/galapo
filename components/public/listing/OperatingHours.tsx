"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

interface DayHours {
    open: string;
    close: string;
    closed: boolean;
}

interface OperatingHoursProps {
    hours: Record<string, DayHours> | null;
}

const DAYS: { key: DayKey; label: string; short: string }[] = [
    { key: "monday", label: "Monday", short: "Mon" },
    { key: "tuesday", label: "Tuesday", short: "Tue" },
    { key: "wednesday", label: "Wednesday", short: "Wed" },
    { key: "thursday", label: "Thursday", short: "Thu" },
    { key: "friday", label: "Friday", short: "Fri" },
    { key: "saturday", label: "Saturday", short: "Sat" },
    { key: "sunday", label: "Sunday", short: "Sun" },
];

function formatTime(t: string): string {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m || 0).padStart(2, "0")} ${ampm}`;
}

function getCurrentDayKey(): DayKey {
    // PH timezone
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
    const jsDay = now.getDay(); // 0 = Sunday
    const keys: DayKey[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    return keys[jsDay];
}

export default function OperatingHours({ hours }: OperatingHoursProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const todayKey = mounted ? getCurrentDayKey() : null;

    if (!hours) {
        return (
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                Contact us for operating hours.
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
                <tbody>
                    {DAYS.map(({ key, label, short }, idx) => {
                        const dayHours = hours[key];
                        const isToday = key === todayKey;
                        const isClosed = !dayHours || dayHours.closed;
                        const is24h = dayHours && dayHours.open === "00:00" && dayHours.close === "23:59";

                        return (
                            <tr
                                key={key}
                                className={cn(
                                    "border-b border-border/50 transition-colors last:border-0",
                                    isToday ? "bg-secondary/5" : idx % 2 === 0 ? "bg-transparent" : "bg-muted/20"
                                )}
                            >
                                <td className="px-4 py-3 font-medium">
                                    <div className="flex items-center gap-2">
                                        {isToday && (
                                            <span className="h-2 w-2 rounded-full bg-secondary animate-pulse shrink-0" />
                                        )}
                                        <span className={cn(isToday ? "text-secondary font-semibold" : "text-foreground")}>
                                            <span className="hidden sm:inline">{label}</span>
                                            <span className="sm:hidden">{short}</span>
                                        </span>
                                        {isToday && (
                                            <span className="rounded-full bg-secondary/20 px-1.5 py-0.5 text-[10px] font-medium text-secondary">
                                                Today
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {isClosed ? (
                                        <span className="font-medium text-red-500">Closed</span>
                                    ) : is24h ? (
                                        <span className="font-medium text-emerald-600">Open 24 Hours</span>
                                    ) : (
                                        <span className={cn(isToday ? "text-secondary font-medium" : "text-muted-foreground")}>
                                            {formatTime(dayHours.open)} – {formatTime(dayHours.close)}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
