"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import OperatingHours from "@/components/public/listing/OperatingHours";
import DynamicFields from "@/components/public/listing/DynamicFields";
import DealsList from "@/components/public/listing/DealsList";
import EventsList from "@/components/public/listing/EventsList";

const PAYMENT_METHOD_ICONS: Record<string, string> = {
    cash: "💵",
    gcash: "📱",
    "credit card": "💳",
    "debit card": "💳",
    maya: "📱",
    bank: "🏦",
    paypal: "🌐",
    check: "📄",
};

interface Tab {
    id: string;
    label: string;
}

interface ListingTabsClientProps {
    tabs: Tab[];
    description: string | null;
    tags: string[];
    paymentMethods: string[];
    fieldValues: any[];
    categoryName?: string;
    hours: any;
    deals: any[];
    events: any[];
}

export default function ListingTabsClient({
    tabs,
    description,
    tags,
    paymentMethods,
    fieldValues,
    categoryName,
    hours,
    deals,
    events,
}: ListingTabsClientProps) {
    const [activeTab, setActiveTab] = useState(tabs[0]?.id || "about");

    return (
        <div className="space-y-0">
            {/* Tab bar */}
            <div className="overflow-x-auto">
                <div className="flex min-w-max gap-0 border-b border-border">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "relative px-5 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                                activeTab === tab.id
                                    ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {tab.label}
                            {tab.id === "deals" && deals.length > 0 && (
                                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                                    {deals.length}
                                </span>
                            )}
                            {tab.id === "events" && events.length > 0 && (
                                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                                    {events.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab content */}
            <div className="rounded-b-2xl border border-t-0 border-border bg-card p-5 sm:p-6">
                {/* ABOUT */}
                {activeTab === "about" && (
                    <div className="space-y-5">
                        {description ? (
                            <div
                                className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-muted-foreground"
                                dangerouslySetInnerHTML={{ __html: description.replace(/\n/g, "<br>") }}
                            />
                        ) : (
                            <p className="text-muted-foreground italic">No description provided.</p>
                        )}

                        {/* Tags */}
                        {tags && tags.length > 0 && (
                            <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Tags
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center rounded-full border border-border bg-muted/40 px-3 py-0.5 text-xs font-medium text-foreground"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Payment methods */}
                        {paymentMethods && paymentMethods.length > 0 && (
                            <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Payment Methods
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {paymentMethods.map((method) => {
                                        const lower = method.toLowerCase();
                                        const icon = PAYMENT_METHOD_ICONS[lower] || "💰";
                                        return (
                                            <span
                                                key={method}
                                                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-foreground"
                                            >
                                                <span>{icon}</span>
                                                {method}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* DETAILS */}
                {activeTab === "details" && (
                    <DynamicFields fieldValues={fieldValues} categoryName={categoryName} />
                )}

                {/* HOURS */}
                {activeTab === "hours" && (
                    <OperatingHours hours={hours} />
                )}

                {/* DEALS */}
                {activeTab === "deals" && (
                    <DealsList deals={deals} />
                )}

                {/* EVENTS */}
                {activeTab === "events" && (
                    <EventsList events={events} />
                )}
            </div>
        </div>
    );
}
