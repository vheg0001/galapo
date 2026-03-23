"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { ShieldAlert } from "lucide-react";

interface AdminAuthGuardProps {
    children: React.ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "authorized" | "unauthorized">("loading");

    useEffect(() => {
        let mounted = true;
        async function checkAuth() {
            try {
                const supabase = createBrowserSupabaseClient();
                const { data: { session } } = await supabase.auth.getSession();

                if (!session?.user) {
                    if (mounted) {
                        router.replace("/admin/login");
                    }
                    return;
                }

                // Check profile role via API
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role, is_active")
                    .eq("id", session.user.id)
                    .single();

                if (!profile || profile.role !== "super_admin" || !profile.is_active) {
                    if (mounted) {
                        router.replace("/admin/login?error=unauthorized");
                    }
                    return;
                }

                if (mounted) setStatus("authorized");
            } catch {
                if (mounted) router.replace("/admin/login");
            }
        }

        checkAuth();
        return () => { mounted = false; };
    }, [router]);

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0F1A2E]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FF6B35] border-t-transparent" />
                    <p className="text-sm text-gray-400">Verifying access...</p>
                </div>
            </div>
        );
    }

    if (status === "unauthorized") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0F1A2E]">
                <div className="flex flex-col items-center gap-4 text-center">
                    <ShieldAlert className="h-12 w-12 text-red-400" />
                    <p className="text-lg font-semibold text-white">Access Denied</p>
                    <p className="text-sm text-gray-400">You do not have permission to access this area.</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
