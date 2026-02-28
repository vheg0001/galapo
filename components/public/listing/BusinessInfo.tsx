"use client";

import Link from "next/link";
import { MapPin, Clock, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo, useState, useEffect } from "react";

interface BusinessInfoProps {
    businessName: string;
    address: string;
    category: { name: string; slug: string } | null;
    subcategory: { name: string; slug: string } | null;
    operatingHours: Record<string, { open: string; close: string; closed: boolean }> | null;
    isFeatured: boolean;
    isPremium: boolean;
}

const DAYS_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

function parseTime(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
}

function getOpenStatus(hours: BusinessInfoProps["operatingHours"]): {
    isOpen: boolean;
    label: string;
} {
    if (!hours) return { isOpen: false, label: "Hours unavailable" };

    // PH timezone
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
    const dayName = DAYS_ORDER[now.getDay() === 0 ? 6 : now.getDay() - 1];
    const dayHours = hours[dayName];

    if (!dayHours || dayHours.closed) return { isOpen: false, label: "Closed today" };

    const currentMins = now.getHours() * 60 + now.getMinutes();
    const openMins = parseTime(dayHours.open);
    const closeMins = parseTime(dayHours.close);

    const isOpen = currentMins >= openMins && currentMins < closeMins;
    const closeDisplay = dayHours.close;
    return {
        isOpen,
        label: isOpen ? `Open · Closes at ${formatTime(closeDisplay)}` : `Closed · Opens at ${formatTime(dayHours.open)}`,
    };
}

function formatTime(t: string): string {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function BusinessInfo({
    businessName,
    address,
    category,
    subcategory,
    operatingHours,
    isFeatured,
    isPremium,
}: BusinessInfoProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const openStatus = useMemo(() => {
        if (!mounted) return { isOpen: false, label: "Checking status..." };
        return getOpenStatus(operatingHours);
    }, [operatingHours, mounted]);

    return (
        <div className="space-y-3">
            {/* Badges row */}
            {(isPremium || isFeatured) && (
                <div className="flex gap-2">
                    {isPremium && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                            ⭐ Premium
                        </span>
                    )}
                    {isFeatured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                            🔥 Featured
                        </span>
                    )}
                </div>
            )}

            {/* Business name */}
            <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl lg:text-4xl">
                {businessName}
            </h1>

            {/* Category tags */}
            {(category || subcategory) && (
                <div className="flex flex-wrap gap-2">
                    {category && (
                        <Link
                            href={`/olongapo/${category.slug}`}
                            className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                        >
                            {category.name}
                        </Link>
                    )}
                    {subcategory && (
                        <>
                            {category && <span className="text-muted-foreground/40 text-xs self-center">›</span>}
                            <Link
                                href={`/olongapo/${category?.slug}/${subcategory.slug}`}
                                className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                            >
                                {subcategory.name}
                            </Link>
                        </>
                    )}
                </div>
            )}

            {/* Address */}
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{address}</span>
            </div>

            {/* Open status */}
            <div className={cn(
                "flex items-center gap-2 text-sm font-medium",
                openStatus.isOpen ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
            )}>
                {openStatus.isOpen
                    ? <CheckCircle className="h-4 w-4" />
                    : <XCircle className="h-4 w-4" />
                }
                <span>{openStatus.label}</span>
            </div>
        </div>
    );
}
