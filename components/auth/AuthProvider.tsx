"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — AuthProvider (Module 7.1)
// Provides auth context and listens to Supabase auth state changes.
// ──────────────────────────────────────────────────────────

import { useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

interface AuthProviderProps {
    children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
    const { initialize, setUser, setSession, loadProfile, setLoading } = useAuthStore();

    useEffect(() => {
        // Initialize auth state on mount
        initialize();

        const supabase = createBrowserSupabaseClient();

        // Listen for auth state changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                    if (session?.user) {
                        setUser(session.user);
                        setSession(session);
                        await loadProfile(session.user.id);
                    }
                } else if (event === "SIGNED_OUT") {
                    setUser(null);
                    setSession(null);
                    useAuthStore.setState({ profile: null, isAuthenticated: false });
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, [initialize, setUser, setSession, loadProfile, setLoading]);

    return <>{children}</>;
}
