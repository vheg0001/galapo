"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — Business Owner Layout (Module 7.1)
// Authenticated layout wrapping all /business/* pages
// ──────────────────────────────────────────────────────────

import { useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import Sidebar from "@/components/business/Sidebar";
import TopBar from "@/components/business/TopBar";
import MobileNav from "@/components/business/MobileNav";
import { useNotifications } from "@/hooks/useNotifications";

export default function BusinessLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const { unreadCount } = useNotifications();

    return (
        <AuthGuard requireRole="business_owner">
            <div className="flex min-h-screen bg-[#F5F7FA]">
                {/* Desktop Sidebar */}
                <div className="hidden h-screen w-64 shrink-0 sticky top-0 lg:block print:hidden">
                    <Sidebar unreadNotifications={unreadCount} />
                </div>

                {/* Mobile Sidebar (slide-in overlay) */}
                {mobileSidebarOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                            onClick={() => setMobileSidebarOpen(false)}
                        />
                        <div className="fixed left-0 top-0 z-50 h-full w-64 lg:hidden">
                            <Sidebar unreadNotifications={unreadCount} />
                        </div>
                    </>
                )}


                {/* Main Content Area */}
                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="print:hidden">
                        <TopBar
                            onMobileMenuToggle={() => setMobileSidebarOpen((v) => !v)}
                            unreadNotifications={unreadCount}
                        />
                    </div>

                    {/* Page Content */}
                    <main className="flex-1 overflow-auto p-4 pb-20 lg:p-6 lg:pb-6 print:p-0 print:bg-white">
                        {children}
                    </main>
                </div>

                {/* Mobile Bottom Navigation */}
                <div className="print:hidden">
                    <MobileNav
                        unreadNotifications={unreadCount}
                        onMoreClick={() => setMobileSidebarOpen(true)}
                    />
                </div>
            </div>
        </AuthGuard>
    );
}
