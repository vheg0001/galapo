"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Event } from "@/lib/types";
import { cn } from "@/lib/utils";
import EventsList from "@/components/business/events/EventsList";

export default function BusinessEventsPage() {
    const [tab, setTab] = useState<"upcoming" | "past" | "all">("upcoming");
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    const loadEvents = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/business/events?status=${tab}`);
            const payload = await response.json();
            setEvents(payload.data || []);
        } catch (error) {
            console.error("Failed to load business events", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEvents();
    }, [tab]);

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
            ) : (
                <EventsList events={events} onToggleActive={toggleActive} onDelete={removeEvent} />
            )}
        </div>
    );
}