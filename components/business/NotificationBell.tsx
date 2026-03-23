"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — NotificationBell (Module 7.1)
// ──────────────────────────────────────────────────────────

import Link from "next/link";
import { Bell } from "lucide-react";

interface NotificationBellProps {
    count?: number;
}

export default function NotificationBell({ count = 0 }: NotificationBellProps) {
    return (
        <Link
            href="/business/notifications"
            className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition"
            aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ""}`}
        >
            <Bell size={20} />
            {count > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF6B35] px-1 text-[10px] font-bold text-white leading-none">
                    {count > 99 ? "99+" : count}
                </span>
            )}
        </Link>
    );
}
