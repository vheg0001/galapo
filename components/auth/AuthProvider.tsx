"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — AuthProvider (Module 7.1)
// Provides auth context and listens to Supabase auth state changes.
// ──────────────────────────────────────────────────────────

import { useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";

interface AuthProviderProps {
    children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
    // DO NOT destructure directly from useAuthStore() as it causes re-renders on any state change
    // Even better, for actions inside useEffect, we can use getState() to avoid re-renders
    const initialize = useAuthStore(state => state.initialize);
    const setLoading = useAuthStore(state => state.setLoading);

    useEffect(() => {
        let isMounted = true;
        let subscription: any = null;
        const supabase = createBrowserSupabaseClient();

        async function setupAuth() {
            // Use a stable reference to avoid re-running if the store re-initializes
            const hasInitialized = useAuthStore.getState().user !== null || useAuthStore.getState().profile !== null;
            
            // 1. Initialize auth state first
            await initialize();

            if (!isMounted) return;

            // 2. Only after initialization is complete, listen for subsequent changes
            const { data } = supabase.auth.onAuthStateChange(
                async (event: AuthChangeEvent, session: Session | null) => {
                    // Ignore INITIAL_SESSION here since initialize() already handled it
                    if (event === "INITIAL_SESSION") {
                        return;
                    }

                    try {
                        const { setUser, setSession, loadProfile } = useAuthStore.getState();

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
                    } catch (err) {
                        console.error("AuthProvider: Auth change error:", err);
                    } finally {
                        setLoading(false);
                    }
                }
            );

            subscription = data.subscription;
        }

        setupAuth();

        return () => {
            isMounted = false;
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, [initialize, setLoading]);

    return <>{children}</>;
}
