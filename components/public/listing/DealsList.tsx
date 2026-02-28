"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Tag, Clock } from "lucide-react";

function getDaysLeft(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    end.setHours(23, 59, 59, 0);
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

interface Deal {
    id: string;
    title: string;
    description: string;
    image_url: string | null;
    discount_text: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

interface DealsListProps {
    deals: Deal[];
}



export default function DealsList({ deals }: DealsListProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !deals || deals.length === 0) return null;

    return (
        <div className="space-y-4">
            {deals.map((deal) => {
                const daysLeft = getDaysLeft(deal.end_date);
                return (
                    <div
                        key={deal.id}
                        className="overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 dark:border-orange-800/40"
                    >
                        {/* Deal image */}
                        {deal.image_url && (
                            <div className="relative aspect-[3/1] w-full overflow-hidden bg-muted">
                                <Image src={deal.image_url} alt={deal.title} fill className="object-cover" />
                            </div>
                        )}

                        <div className="p-4">
                            {/* Discount badge */}
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
                                    <Tag className="h-3 w-3" />
                                    {deal.discount_text}
                                </span>
                                {daysLeft >= 0 && daysLeft <= 7 && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
                                        <Clock className="h-3 w-3" />
                                        {daysLeft === 0 ? "Expires today!" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}
                                    </span>
                                )}
                            </div>

                            <h4 className="font-bold text-foreground">{deal.title}</h4>
                            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{deal.description}</p>

                            {/* Expiry */}
                            <p className="mt-3 text-[11px] text-muted-foreground/70">
                                Offer expires:{" "}
                                {new Date(deal.end_date).toLocaleDateString("en-PH", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
