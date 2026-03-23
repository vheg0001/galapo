"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import SidebarNavGroup from "./SidebarNavGroup";
import SidebarNavItem from "./SidebarNavItem";
import {
    LayoutDashboard, Building2, Tag, MapPin, Ticket, Calendar, BookOpen, FileText,
    CreditCard, Receipt, FileSpreadsheet, MonitorPlay, Search, Users, ShieldCheck,
    Settings, Bell, ClipboardList, FileDown, BarChart2, ChevronLeft, ChevronRight,
    LogOut, ExternalLink, Award
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    pendingListings?: number;
    pendingPayments?: number;
    pendingClaims?: number;
    adminName?: string;
    siteName?: string;
    siteTagline?: string;
}

export default function AdminSidebar({
    collapsed,
    onToggle,
    pendingListings = 0,
    pendingPayments = 0,
    pendingClaims = 0,
    adminName = "Admin",
    siteName = "GalaPo",
    siteTagline = "Admin Panel"
}: AdminSidebarProps) {
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);

    async function handleLogout() {
        setLoggingOut(true);
        const supabase = createBrowserSupabaseClient();
        await supabase.auth.signOut();
        router.push("/admin/login");
    }

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 flex h-full flex-col bg-[#0F1A2E] transition-all duration-300",
                collapsed ? "w-16" : "w-[260px]"
            )}
        >
            {/* Header */}
            <div className={cn(
                "flex h-16 items-center border-b border-white/10",
                collapsed ? "justify-center px-2" : "justify-between px-5"
            )}>
                {!collapsed && (
                    <div className="overflow-hidden">
                        <span className="block truncate text-lg font-extrabold tracking-tight text-white">{siteName}</span>
                        <p className="truncate text-[10px] font-medium text-[#FF6B35]">{siteTagline}</p>
                    </div>
                )}
                <button
                    onClick={onToggle}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-white/10 hover:text-white"
                >
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </button>
            </div>

            {/* Nav */}
            <nav className="scrollbar-hide flex-1 overflow-y-auto px-2 py-3 space-y-1">
                <SidebarNavGroup label="Overview" emoji="📊" collapsed={collapsed}>
                    <SidebarNavItem href="/admin/dashboard" label="Dashboard" icon={LayoutDashboard} collapsed={collapsed} />
                </SidebarNavGroup>

                <SidebarNavGroup label="Content Management" emoji="📋" collapsed={collapsed}>
                    <SidebarNavItem href="/admin/listings" label="Listings" icon={Building2} badge={pendingListings} collapsed={collapsed} />
                    <SidebarNavItem href="/admin/categories" label="Categories" icon={Tag} collapsed={collapsed} />
                    <SidebarNavItem href="/admin/barangays" label="Barangays" icon={MapPin} collapsed={collapsed} />
                    <SidebarNavItem href="/admin/badges" label="Badges" icon={Award} collapsed={collapsed} />
                    <SidebarNavItem href="/admin/deals" label="Deals & Offers" icon={Ticket} collapsed={collapsed} />
                    <SidebarNavItem href="/admin/events" label="Events" icon={Calendar} collapsed={collapsed} />
                    <SidebarNavItem href="/admin/blog" label="Blog Posts" icon={BookOpen} collapsed={collapsed} />
                    <SidebarNavItem href="/admin/pages" label="Static Pages" icon={FileText} collapsed={collapsed} />
                </SidebarNavGroup>

                <SidebarNavGroup label="Monetization" emoji="💰" collapsed={collapsed}>
                    <SidebarNavItem href="/admin/subscriptions" label="Subscriptions" icon={CreditCard} collapsed={collapsed} />
                    <SidebarNavItem href="/admin/payments" label="Payments" icon={Receipt} badge={pendingPayments} collapsed={collapsed} />
                    <SidebarNavItem href="/admin/invoices" label="Invoices" icon={FileSpreadsheet} collapsed={collapsed} />
                    <SidebarNavItem href="/admin/ads" label="Ad Management" icon={MonitorPlay} collapsed={collapsed} />
                    <SidebarNavItem href="/admin/top-search" label="Top Search" icon={Search} collapsed={collapsed} />
                </SidebarNavGroup>

                <SidebarNavGroup label="Users" emoji="👥" collapsed={collapsed}>
                    <SidebarNavItem href="/admin/users" label="Business Owners" icon={Users} collapsed={collapsed} />
                    <SidebarNavItem href="/admin/claims" label="Claim Requests" icon={ShieldCheck} badge={pendingClaims} collapsed={collapsed} />
                </SidebarNavGroup>

                <SidebarNavGroup label="System" emoji="⚙️" collapsed={collapsed}>
                    <SidebarNavItem href="/admin/settings" label="Site Settings" icon={Settings} collapsed={collapsed} />
                    <SidebarNavItem href="/admin/notifications" label="Notifications" icon={Bell} collapsed={collapsed} />
                    <SidebarNavItem href="/admin/annual-checks" label="Annual Checks" icon={ClipboardList} collapsed={collapsed} />
                    <SidebarNavItem href="/admin/import-export" label="CSV Import/Export" icon={FileDown} collapsed={collapsed} />
                    <SidebarNavItem href="/admin/analytics" label="Analytics" icon={BarChart2} collapsed={collapsed} />
                </SidebarNavGroup>
            </nav>

            {/* Footer */}
            <div className={cn(
                "border-t border-white/10 px-2 py-3 space-y-1",
            )}>
                <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-gray-400 transition hover:bg-white/5 hover:text-gray-200",
                        collapsed && "justify-center"
                    )}
                    title={collapsed ? "View Public Site" : undefined}
                >
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>View Public Site</span>}
                </a>

                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-gray-400 transition hover:bg-red-500/10 hover:text-red-400",
                        collapsed && "justify-center"
                    )}
                    title={collapsed ? "Logout" : undefined}
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{loggingOut ? "Logging out..." : "Logout"}</span>}
                </button>
            </div>
        </aside>
    );
}
