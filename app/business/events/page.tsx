"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Tag } from "lucide-react";
import type { Event } from "@/lib/types";
import { cn } from "@/lib/utils";
import EventsList from "@/components/business/events/EventsList";
import PlanLimitIndicator from "@/components/business/deals/PlanLimitIndicator";

export default function BusinessEventsPage() {
    const [tab, setTab] = useState<"upcoming" | "past" | "all">("upcoming");
    const [events, setEvents] = useState<Event[]>([]);
    const [limits, setLimits] = useState<Array<{
        listing_id: string;
        business_name: string;
        plan: "free" | "featured" | "premium";
        max: number;
        used: number;
        remaining: number;
    }>>([]);
    const [loading, setLoading] = useState(true);

    const loadEvents = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/business/events?status=${tab}`);
            const payload = await response.json();
            setEvents(payload.data || []);
            setLimits(Array.isArray(payload.limits) ? payload.limits : []);
        } catch (error) {
            console.error("Failed to load business events", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEvents();
    }, [tab]);

    const usageByPlan = useMemo(() => {
        const grouped = limits.reduce((acc, current) => {
            const existing = acc[current.plan] || {
                plan: current.plan,
                used: 0,
                total: 0,
                listingsCount: 0,
            };

            existing.used += current.used;
            existing.total += current.max;
            existing.listingsCount += 1;

            acc[current.plan] = existing;
            return acc;
        }, {} as Record<string, { plan: string; used: number; total: number; listingsCount: number }>);

        const orderedPlans = ["free", "featured", "premium"] as const;
        const planLabels: Record<(typeof orderedPlans)[number], string> = {
            free: "Free",
            featured: "Featured",
            premium: "Premium",
        };

        return orderedPlans
            .map((plan) => grouped[plan])
            .filter(Boolean)
            .map((plan) => ({
                ...plan,
                label: planLabels[plan.plan as keyof typeof planLabels],
            }));
    }, [limits]);

    const toggleActive = async (event: Event) => {
        await fetch(`/api/business/events/${event.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_active: !event.is_active }),
        });
        loadEvents();
    };

    const removeEvent = async (event: Event) => {
        if (!window.confirm("Delete this event?")) return;
        await fetch(`/api/business/events/${event.id}`, { method: "DELETE" });
        loadEvents();
    };

    return (
        <div className="space-y-8 p-6 lg:p-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground">Events</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Create and manage events for your business listings.</p>
                </div>
                <Link href="/business/events/new" className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/15 transition hover:bg-primary/90">
                    <Plus className="h-4 w-4" />
                    Create New Event
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <div className="inline-flex rounded-2xl border border-border bg-card p-1 shadow-sm">
                        {[
                            { value: "upcoming", label: "Upcoming" },
                            { value: "past", label: "Past" },
                            { value: "all", label: "All" },
                        ].map((option) => (
                            <button key={option.value} type="button" onClick={() => setTab(option.value as typeof tab)} className={cn("rounded-xl px-4 py-2 text-sm font-bold transition-colors", tab === option.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>{option.label}</button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="rounded-[2rem] border border-border bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">Loading your events…</div>
                    ) : events.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-border bg-card/50 py-20 text-center">
                            <Tag size={40} className="mb-4 text-muted-foreground/20" />
                            <h3 className="text-lg font-bold text-foreground">No events found</h3>
                            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                                {tab === "upcoming" ? "You don't have any upcoming events scheduled." : "No events found for this filter."}
                            </p>
                            {tab === "upcoming" && (
                                <Link href="/business/events/new" className="mt-6 font-bold text-primary hover:underline">
                                    Create an event now →
                                </Link>
                            )}
                        </div>
                    ) : (
                        <EventsList events={events} onToggleActive={toggleActive} onDelete={removeEvent} />
                    )}
                </div>

                {/* Right: Info/Limits */}
                <div className="space-y-6">
                    {usageByPlan.map((usage) => (
                        <PlanLimitIndicator
                            key={usage.plan}
                            used={usage.used}
                            total={usage.total}
                            title={`${usage.label} Event Slot Usage`}
                            subtitle={`${usage.listingsCount} ${usage.listingsCount === 1 ? "listing" : "listings"}`}
                        />
                    ))}

                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 text-blue-900">
                        <h4 className="text-sm font-bold uppercase tracking-wider">Quick Tip</h4>
                        <p className="mt-2 text-sm leading-relaxed opacity-80">
                            Events from <strong>Premium</strong> and <strong>Featured</strong> listings also appear in the "What's On" section for extra visibility!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}