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
    const { initialize, setUser, setSession, loadProfile, setLoading } = useAuthStore();

    useEffect(() => {
        let isMounted = true;
        let subscription: any = null;
        const supabase = createBrowserSupabaseClient();

        async function setupAuth() {
            // 1. Initialize auth state first
            await initialize();

            if (!isMounted) return;

            // 2. Only after initialization is complete, listen for subsequent changes
            const { data } = supabase.auth.onAuthStateChange(
                async (event: AuthChangeEvent, session: Session | null) => {
                    console.log(`AuthProvider: auth state change detected: ${event}, session exists: ${!!session}`);

                    // Ignore INITIAL_SESSION here since initialize() already handled it
                    if (event === "INITIAL_SESSION") {
                        return; // We don't need to setLoading(false) here, initialize() did it.
                    }

                    try {
                        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                            if (session?.user) {
                                console.log("AuthProvider: updating store with user and loading profile...");
                                setUser(session.user);
                                setSession(session);
                                await loadProfile(session.user.id);
                            }
                        } else if (event === "SIGNED_OUT") {
                            console.log("AuthProvider: user signed out, clearing store...");
                            setUser(null);
                            setSession(null);
                            useAuthStore.setState({ profile: null, isAuthenticated: false });
                        }
                    } catch (err) {
                        console.error("AuthProvider: Auth change error:", err);
                    } finally {
                        console.log("AuthProvider: updating loading state to false.");
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
    }, [initialize, setUser, setSession, loadProfile, setLoading]);

    return <>{children}</>;
}
