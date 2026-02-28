"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — Business Dashboard Sidebar (Module 7.1)
// Navy blue sidebar with coral orange active state
// ──────────────────────────────────────────────────────────

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
    LayoutDashboard,
    Store,
    PlusCircle,
    Tag,
    CalendarDays,
    CreditCard,
    Bell,
    Settings,
    ExternalLink,
    LogOut,
} from "lucide-react";

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: number;
}

const NAV_ITEMS: NavItem[] = [
    { label: "Dashboard", href: "/business/dashboard", icon: LayoutDashboard },
    { label: "My Listings", href: "/business/listings", icon: Store },
    { label: "Add New Listing", href: "/business/listings/new", icon: PlusCircle },
    { label: "Deals & Offers", href: "/business/deals", icon: Tag },
    { label: "Events", href: "/business/events", icon: CalendarDays },
    { label: "Subscription & Billing", href: "/business/billing", icon: CreditCard },
    { label: "Notifications", href: "/business/notifications", icon: Bell },
    { label: "Account Settings", href: "/business/settings", icon: Settings },
];

interface SidebarProps {
    unreadNotifications?: number;
}

export default function Sidebar({ unreadNotifications = 0 }: SidebarProps) {
    const pathname = usePathname();
    const { logout, profile } = useAuthStore();

    const isActive = (href: string) =>
        pathname === href || pathname.startsWith(href + "/");

    return (
        <aside className="flex h-full w-64 flex-col bg-[#1B2A4A] text-white">
            {/* Logo */}
            <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-6">
                <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                    <span className="text-2xl font-black tracking-tight text-white">
                        Gala<span className="text-[#FF6B35]">Po</span>
                    </span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="space-y-0.5">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        const badgeCount = item.label === "Notifications" ? unreadNotifications : 0;

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all
                                        ${active
                                            ? "bg-[#FF6B35] text-white shadow-md"
                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                        }`}
                                >
                                    <Icon size={18} className={active ? "text-white" : "text-white/60 group-hover:text-white"} />
                                    <span className="flex-1">{item.label}</span>
                                    {badgeCount > 0 && (
                                        <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold
                                            ${active ? "bg-white text-[#FF6B35]" : "bg-[#FF6B35] text-white"}`}>
                                            {badgeCount > 99 ? "99+" : badgeCount}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Bottom Section */}
            <div className="shrink-0 border-t border-white/10 p-3 space-y-1">
                {/* User Info */}
                {profile && (
                    <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF6B35] text-xs font-bold text-white">
                            {profile.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-white">{profile.full_name}</p>
                            <p className="truncate text-xs text-white/50">{profile.email}</p>
                        </div>
                    </div>
                )}

                <Link
                    href="/"
                    target="_blank"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white transition"
                >
                    <ExternalLink size={16} />
                    View Public Site
                </Link>

                <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-red-500/20 hover:text-red-300 transition"
                >
                    <LogOut size={16} />
                    Logout
                </button>
            </div>
        </aside>
    );
}
