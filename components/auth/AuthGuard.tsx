"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — AuthGuard (Module 7.1)
// Wraps business dashboard pages; redirects unauthenticated users.
// ──────────────────────────────────────────────────────────

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

interface AuthGuardProps {
    children: React.ReactNode;
    requireRole?: "business_owner" | "super_admin";
}

export default function AuthGuard({
    children,
    requireRole = "business_owner",
}: AuthGuardProps) {
    const router = useRouter();
    const { isAuthenticated, isLoading, profile, setLoading } = useAuthStore();

    // Safety net: if loading takes more than 10s, force it to false
    useEffect(() => {
        if (!isLoading) return;
        const timer = setTimeout(() => {
            console.warn("AuthGuard: loading timed out (10s), forcing isLoading to false. This may be due to slow network or RLS issues.");
            setLoading(false);
        }, 10000);
        return () => clearTimeout(timer);
    }, [isLoading, setLoading]);

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated) {
            router.replace("/login");
            return;
        }

        if (requireRole && profile && profile.role !== requireRole && profile.role !== "super_admin") {
            router.replace("/login?error=unauthorized");
            return;
        }
    }, [isAuthenticated, isLoading, profile, requireRole, router]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA]">
                <div className="flex flex-col items-center gap-4">
                    <div data-testid="loading-spinner" className="h-10 w-10 animate-spin rounded-full border-4 border-[#1B2A4A] border-t-transparent" />
                    <p className="text-sm text-gray-500">Checking authentication…</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect via useEffect
    }

    return <>{children}</>;
}
