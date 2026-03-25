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

        async function setupAuth() {
            try {
                const supabase = createBrowserSupabaseClient();
                console.log("AuthProvider: Initializing...");
                await initialize();
                
                if (!isMounted) return;

                const { data } = supabase.auth.onAuthStateChange(
                    async (event, session) => {
                        if (event === "INITIAL_SESSION") return;
                        if (!isMounted) return;
                        
                        console.log("AuthProvider: Auth state changed:", event);
                        const { setUser, setSession, loadProfile } = useAuthStore.getState();

                        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                            if (session?.user) {
                                setUser(session.user);
                                setSession(session);
                                loadProfile(session.user.id); // Background
                            }
                        } else if (event === "SIGNED_OUT") {
                            setUser(null);
                            setSession(null);
                            useAuthStore.setState({ profile: null, isAuthenticated: false });
                        }
                    }
                );
                subscription = data.subscription;
            } catch (err) {
                console.error("AuthProvider critical mount error:", err);
            } finally {
                setLoading(false);
            }
        }

        setupAuth();

        return () => {
            isMounted = false;
            if (subscription) subscription.unsubscribe();
        };
    }, []); // Run ONLY once on mount

    return <>{children}</>;
}
