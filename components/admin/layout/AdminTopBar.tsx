"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Menu, ChevronDown, User, LogOut } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface AdminTopBarProps {
    onMenuToggle: () => void;
    adminName?: string;
    adminEmail?: string;
    unreadNotifications?: number;
    breadcrumbs?: { label: string; href?: string }[];
}

export default function AdminTopBar({
    onMenuToggle, adminName = "Admin", adminEmail = "", unreadNotifications = 0, breadcrumbs = []
}: AdminTopBarProps) {
    const router = useRouter();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    async function handleLogout() {
        const supabase = createBrowserSupabaseClient();
        await supabase.auth.signOut();
        router.push("/admin/login");
    }

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-4 shadow-sm">
            {/* Left: Hamburger + Breadcrumbs */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuToggle}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground lg:hidden"
                    aria-label="Open menu"
                >
                    <Menu className="h-5 w-5" />
                </button>

                {breadcrumbs.length > 0 && (
                    <nav className="hidden items-center gap-1 text-sm sm:flex">
                        <span className="text-muted-foreground">Admin</span>
                        {breadcrumbs.map((crumb, i) => (
                            <span key={i} className="flex items-center gap-1">
                                <span className="text-muted-foreground">/</span>
                                {crumb.href ? (
                                    <Link href={crumb.href} className="text-muted-foreground hover:text-foreground transition">
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className="font-medium text-foreground">{crumb.label}</span>
                                )}
                            </span>
                        ))}
                    </nav>
                )}
            </div>

            {/* Right: Notification Bell + Profile Dropdown */}
            <div className="flex items-center gap-2">
                <Link
                    href="/admin/notifications"
                    className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                    <Bell className="h-5 w-5" />
                    {unreadNotifications > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF6B35] px-1 text-[10px] font-bold text-white">
                            {unreadNotifications > 9 ? "9+" : unreadNotifications}
                        </span>
                    )}
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm transition hover:bg-muted"
                    >
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0F1A2E] text-xs font-bold text-white">
                            {adminName.charAt(0).toUpperCase()}
                        </div>
                        <span className="hidden font-medium text-foreground sm:block">{adminName}</span>
                        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition", dropdownOpen && "rotate-180")} />
                    </button>

                    {dropdownOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setDropdownOpen(false)}
                            />
                            <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
                                <div className="border-b border-border px-3 py-2">
                                    <p className="text-xs font-semibold text-foreground">{adminName}</p>
                                    <p className="truncate text-[10px] text-muted-foreground">{adminEmail}</p>
                                </div>
                                <div className="py-1">
                                    <Link
                                        href="/admin/profile"
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-foreground transition hover:bg-muted"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        <User className="h-3.5 w-3.5" />
                                        Profile
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 transition hover:bg-red-50"
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
