"use client";

import { useState, useEffect } from "react";
import AdminAuthGuard from "@/components/admin/auth/AdminAuthGuard";
import AdminSidebar from "@/components/admin/layout/AdminSidebar";
import AdminTopBar from "@/components/admin/layout/AdminTopBar";
import AdminMobileNav from "@/components/admin/layout/AdminMobileNav";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface AdminStats {
    pending_listings: number;
    pending_payments: number;
    pending_claims: number;
    unread_notifications: number;
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [adminName, setAdminName] = useState("Admin");
    const [adminEmail, setAdminEmail] = useState("");
    const [siteName, setSiteName] = useState("GalaPo");
    const [siteTagline, setSiteTagline] = useState("Admin Panel");
    const [stats, setStats] = useState<AdminStats>({
        pending_listings: 0,
        pending_payments: 0,
        pending_claims: 0,
        unread_notifications: 0
    });

    useEffect(() => {
        async function loadProfile() {
            const supabase = createBrowserSupabaseClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("full_name, email")
                    .eq("id", session.user.id)
                    .single();
                if (profile) {
                    setAdminName(profile.full_name || session.user.email?.split("@")[0] || "Admin");
                    setAdminEmail(session.user.email || "");
                }
            }
        }

        async function loadSettings() {
            try {
                const res = await fetch("/api/admin/settings");
                if (res.ok) {
                    const { data } = await res.json();
                    if (data?.site_name) setSiteName(data.site_name);
                    if (data?.site_tagline) setSiteTagline(data.site_tagline);
                }
            } catch { /* non-critical */ }
        }

        async function loadStats() {
            try {
                const res = await fetch("/api/admin/stats");
                if (res.ok) {
                    const data = await res.json();
                    setStats({
                        pending_listings: data.pending_listings ?? 0,
                        pending_payments: data.pending_payments ?? 0,
                        pending_claims: data.pending_claims ?? 0,
                        unread_notifications: data.unread_notifications ?? 0,
                    });
                }
            } catch { /* non-critical */ }
        }

        loadProfile();
        loadSettings();
        loadStats();

        // 4. Real-time Subscriptions
        const supabase = createBrowserSupabaseClient();
        const channel = supabase
            .channel("admin-stats-updates")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "listings" },
                () => loadStats()
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "payments" },
                () => loadStats()
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "notifications" },
                () => loadStats()
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "claims" }, // If claims is a separate table
                () => loadStats()
            )
            .subscribe();

        window.addEventListener("admin_notifications_read", loadStats);

        return () => {
            supabase.removeChannel(channel);
            window.removeEventListener("admin_notifications_read", loadStats);
        };
    }, []);

    return (
        <div className="flex min-h-screen overflow-x-hidden bg-[#F5F7FA]">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block print:hidden">
                <AdminSidebar
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    pendingListings={stats.pending_listings}
                    pendingPayments={stats.pending_payments}
                    pendingClaims={stats.pending_claims}
                    pendingNotifications={stats.unread_notifications}
                    adminName={adminName}
                    siteName={siteName}
                    siteTagline={siteTagline}
                />
            </div>

            {/* Mobile Nav */}
            <div className="print:hidden">
                <AdminMobileNav
                    open={mobileNavOpen}
                onClose={() => setMobileNavOpen(false)}
                pendingListings={stats.pending_listings}
                pendingPayments={stats.pending_payments}
                pendingClaims={stats.pending_claims}
                pendingNotifications={stats.unread_notifications}
                adminName={adminName}
                siteName={siteName}
                siteTagline={siteTagline}
            />
            </div>

            {/* Main content area */}
            <div className={cn(
                "flex min-w-0 flex-1 flex-col transition-all duration-300",
                sidebarCollapsed ? "lg:pl-16" : "lg:pl-[260px]"
            )}>
                <div className="print:hidden">
                    <AdminTopBar
                        onMenuToggle={() => setMobileNavOpen(true)}
                        adminName={adminName}
                        adminEmail={adminEmail}
                    />
                </div>
                <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8 print:p-0 print:bg-white">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminAuthGuard>
            <AdminLayoutInner>{children}</AdminLayoutInner>
        </AdminAuthGuard>
    );
}
