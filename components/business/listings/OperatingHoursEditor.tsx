"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — OperatingHoursEditor Component (Module 9.1)
// 7-day table with time pickers and closed toggles
// ──────────────────────────────────────────────────────────

import type { OperatingHours, DayHours } from "@/lib/types";
import { Copy } from "lucide-react";

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
        onChange({ ...value, [day]: { ...value[day], ...patch } });
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
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={copyMondayToAll}
                    className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                    <Copy size={13} />
                    Copy Monday to all days
                </button>
            </div>

            {/* Days table */}
            <div className="overflow-hidden rounded-xl border border-gray-200">
                <div className="hidden grid-cols-[130px_1fr_1fr_auto] items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-500 sm:grid">
                    <span>Day</span>
                    <span>Opens</span>
                    <span>Closes</span>
                    <span>Closed</span>
                </div>

                <div className="divide-y divide-gray-100">
                    {DAYS.map(({ key, label, short }) => {
                        const day = value[key];
                        return (
                            <div
                                key={key}
                                className={`grid grid-cols-[100px_1fr_1fr_auto] sm:grid-cols-[130px_1fr_1fr_auto] items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 transition ${day.closed ? "bg-gray-50/80" : "bg-white"
                                    }`}
                            >
                                {/* Day name */}
                                <span className="text-sm font-medium text-gray-700">
                                    <span className="sm:hidden">{short}</span>
                                    <span className="hidden sm:inline">{label}</span>
                                </span>

                                {/* Open time */}
                                <input
                                    type="time"
                                    value={day.open}
                                    disabled={day.closed}
                                    onChange={(e) => update(key, { open: e.target.value })}
                                    className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/20"
                                />

                                {/* Close time */}
                                <input
                                    type="time"
                                    value={day.close}
                                    disabled={day.closed}
                                    onChange={(e) => update(key, { close: e.target.value })}
                                    className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/20"
                                />

                                {/* Closed toggle */}
                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={day.closed}
                                            onChange={(e) => update(key, { closed: e.target.checked })}
                                            className="sr-only"
                                        />
                                        <div className={`h-5 w-9 rounded-full transition-colors ${day.closed ? "bg-[#FF6B35]" : "bg-gray-200"}`}>
                                            <div className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${day.closed ? "translate-x-4" : "translate-x-0"}`} />
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500 hidden sm:inline">Closed</span>
                                </label>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
