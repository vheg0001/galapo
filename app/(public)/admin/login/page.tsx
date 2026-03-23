"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Lock, Eye, EyeOff, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";

export default function AdminLoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(error === "unauthorized" ? "You do not have admin access." : "");
    const [checkingSes, setCheckingSes] = useState(true);

    // If already logged in as admin, redirect
    useEffect(() => {
        async function check() {
            const supabase = createBrowserSupabaseClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
                if (profile?.role === "super_admin") {
                    router.replace(searchParams.get("redirect") ?? "/admin/dashboard");
                    return;
                }
            }
            setCheckingSes(false);
        }
        check();
    }, []);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        const supabase = createBrowserSupabaseClient();
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

        if (signInError) {
            setErrorMsg("Invalid email or password.");
            setLoading(false);
            return;
        }

        if (data.session) {
            // Verify role
            const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", data.session.user.id).single();
            if (profile?.role !== "super_admin" || !profile?.is_active) {
                await supabase.auth.signOut();
                setErrorMsg("Access denied. This login is for administrators only.");
                setLoading(false);
                return;
            }
            router.replace(searchParams.get("redirect") ?? "/admin/dashboard");
        }

        setLoading(false);
    }

    if (checkingSes) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0F1A2E]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF6B35] border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0F1A2E] px-4">
            <meta name="robots" content="noindex" />

            {/* Logo */}
            <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF6B35]/10 ring-1 ring-[#FF6B35]/20">
                    <Lock className="h-8 w-8 text-[#FF6B35]" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white">GalaPo Admin</h1>
                <p className="mt-1 text-sm text-gray-500">Restricted access for administrators only.</p>
            </div>

            {/* Card */}
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a2d4f] p-8 shadow-2xl">
                {/* Error Banner */}
                {errorMsg && (
                    <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                        <ShieldAlert className="h-4 w-4 shrink-0" />
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-300">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            placeholder="admin@galapo.ph"
                            className="w-full rounded-xl border border-white/10 bg-[#0F1A2E] px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/30 transition"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-300">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                placeholder="••••••••"
                                className="w-full rounded-xl border border-white/10 bg-[#0F1A2E] px-4 py-2.5 pr-11 text-sm text-white placeholder:text-gray-600 outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]/30 transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !email || !password}
                        className="mt-2 w-full rounded-xl bg-[#FF6B35] py-3 text-sm font-bold text-white transition hover:bg-[#e55a24] focus:ring-2 focus:ring-[#FF6B35]/50 disabled:opacity-50"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p className="mt-5 text-center text-xs text-gray-600">
                    Admin accounts are managed via the Supabase dashboard.
                </p>
            </div>

            <p className="mt-6 text-xs text-gray-700">
                GalaPo Admin Panel · Restricted Access
            </p>
        </div>
    );
}
