"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — MobileNav (Module 7.1)
// Bottom tab navigation for business dashboard on mobile
// ──────────────────────────────────────────────────────────

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Store,
    PlusCircle,
    Bell,
    Menu,
} from "lucide-react";

interface MobileNavProps {
    unreadNotifications?: number;
    onMoreClick?: () => void;
}

const TABS = [
    { label: "Dashboard", href: "/business/dashboard", icon: LayoutDashboard },
    { label: "Listings", href: "/business/listings", icon: Store },
    { label: "Add", href: "/business/listings/new", icon: PlusCircle },
    { label: "Notifications", href: "/business/notifications", icon: Bell },
];

export default function MobileNav({ unreadNotifications = 0, onMoreClick }: MobileNavProps) {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white lg:hidden">
            <div className="flex">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
                    const isNotif = tab.label === "Notifications";

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`flex flex-1 flex-col items-center justify-center py-3 text-xs font-medium transition-colors
                                ${isActive ? "text-[#FF6B35]" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            <div className="relative">
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.75} />
                                {isNotif && unreadNotifications > 0 && (
                                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF6B35] px-1 text-[9px] font-bold text-white leading-none">
                                        {unreadNotifications > 99 ? "99+" : unreadNotifications}
                                    </span>
                                )}
                            </div>
                            <span className="mt-0.5">{tab.label}</span>
                        </Link>
                    );
                })}

                {/* More button */}
                <button
                    type="button"
                    onClick={onMoreClick}
                    className="flex flex-1 flex-col items-center justify-center py-3 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <Menu size={22} strokeWidth={1.75} />
                    <span className="mt-0.5">More</span>
                </button>
            </div>
        </nav>
    );
}
