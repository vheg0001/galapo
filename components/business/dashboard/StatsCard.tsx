"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — StatsCard Component (Module 8.1)
// ──────────────────────────────────────────────────────────

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
    icon: string;
    label: string;
    value: number | string;
    change?: number;
    changeLabel?: string;
    loading?: boolean;
}

export default function StatsCard({
    icon,
    label,
    value,
    change,
    changeLabel = "vs last month",
    loading = false,
}: StatsCardProps) {
    const isPositive = (change ?? 0) > 0;
    const isNegative = (change ?? 0) < 0;
    const isNeutral = change === 0 || change === undefined;

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between">
                <span className="text-3xl">{icon}</span>
                {change !== undefined && !isNeutral && (
                    <span
                        className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${isPositive
                                ? "bg-green-50 text-green-600"
                                : "bg-red-50 text-red-600"
                            }`}
                    >
                        {isPositive ? (
                            <TrendingUp size={11} />
                        ) : (
                            <TrendingDown size={11} />
                        )}
                        {Math.abs(change)}%
                    </span>
                )}
                {isNeutral && change !== undefined && (
                    <span className="flex items-center gap-0.5 rounded-full bg-gray-50 px-2 py-0.5 text-xs font-semibold text-gray-400">
                        <Minus size={11} />
                        0%
                    </span>
                )}
            </div>

            <div className="mt-3">
                {loading ? (
                    <div className="h-8 w-16 animate-pulse rounded bg-gray-100" />
                ) : (
                    <p className="text-3xl font-bold text-gray-900">
                        {typeof value === "number" ? value.toLocaleString() : value}
                    </p>
                )}
                <p className="mt-1 text-sm font-medium text-gray-500">{label}</p>
            </div>

            {change !== undefined && (
                <p className="mt-2 text-xs text-gray-400">{changeLabel}</p>
            )}
        </div>
    );
}
