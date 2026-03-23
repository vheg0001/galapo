"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — QuickActions Component (Module 8.1)
// ──────────────────────────────────────────────────────────

import Link from "next/link";
import { PlusCircle, Tag, CalendarDays } from "lucide-react";

export default function QuickActions() {
    return (
        <div className="flex flex-wrap gap-3">
            <Link
                href="/business/listings/new"
                className="inline-flex items-center gap-2 rounded-lg bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#e55a25] hover:shadow-md active:scale-95"
            >
                <PlusCircle size={16} />
                Add New Listing
            </Link>

            <Link
                href="/business/deals/new"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:border-gray-300 active:scale-95"
            >
                <Tag size={16} />
                Create Deal
            </Link>

            <Link
                href="/business/events/new"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:border-gray-300 active:scale-95"
            >
                <CalendarDays size={16} />
                Create Event
            </Link>
        </div>
    );
}
