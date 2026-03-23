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
        pending_claims: 0
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
                    });
                }
            } catch { /* non-critical */ }
        }

        loadProfile();
        loadSettings();
        loadStats();
    }, []);

    return (
        <div className="flex min-h-screen overflow-x-hidden bg-[#F5F7FA]">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
                <AdminSidebar
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    pendingListings={stats.pending_listings}
                    pendingPayments={stats.pending_payments}
                    pendingClaims={stats.pending_claims}
                    adminName={adminName}
                    siteName={siteName}
                    siteTagline={siteTagline}
                />
            </div>

            {/* Mobile Nav */}
            <AdminMobileNav
                open={mobileNavOpen}
                onClose={() => setMobileNavOpen(false)}
                pendingListings={stats.pending_listings}
                pendingPayments={stats.pending_payments}
                pendingClaims={stats.pending_claims}
                adminName={adminName}
                siteName={siteName}
                siteTagline={siteTagline}
            />

            {/* Main content area */}
            <div className={cn(
                "flex min-w-0 flex-1 flex-col transition-all duration-300",
                sidebarCollapsed ? "lg:pl-16" : "lg:pl-[260px]"
            )}>
                <AdminTopBar
                    onMenuToggle={() => setMobileNavOpen(true)}
                    adminName={adminName}
                    adminEmail={adminEmail}
                />
                <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
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
