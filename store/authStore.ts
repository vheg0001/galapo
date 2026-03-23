// ──────────────────────────────────────────────────────────
// GalaPo — Zustand Auth Store (Module 7.1)
// ──────────────────────────────────────────────────────────

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase";

// ── Profile type (matches Supabase profiles table) ───────

export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    role: "super_admin" | "business_owner";
    avatar_url: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    notification_preferences: {
        email_listing_status: boolean;
        email_subscription_expiry: boolean;
        email_annual_check: boolean;
        email_payment: boolean;
        [key: string]: boolean | undefined;
    } | null;
}

// ── Auth Store Interface ──────────────────────────────────

interface AuthState {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    // Setters
    setUser: (user: User | null) => void;
    setProfile: (profile: Profile | null) => void;
    setSession: (session: Session | null) => void;
    setLoading: (isLoading: boolean) => void;

    // Auth actions
    login: (email: string, password: string) => Promise<{ error: string | null }>;
    register: (
        email: string,
        password: string,
        fullName: string,
        phone: string
    ) => Promise<{ error: string | null }>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: string | null }>;
    updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
    loadProfile: (userId: string) => Promise<void>;
    initialize: () => Promise<void>;
}

// ── Store Implementation ──────────────────────────────────

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            profile: null,
            session: null,
            isLoading: true,
            isAuthenticated: false,

            setUser: (user) =>
                set({ user, isAuthenticated: !!user }),
            setProfile: (profile) => set({ profile }),
            setSession: (session) =>
                set({ session, isAuthenticated: !!session }),
            setLoading: (isLoading) => set({ isLoading }),

            login: async (email, password) => {
                try {
                    const supabase = createBrowserSupabaseClient();
                    const { data, error } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                    });

                    if (error) return { error: error.message };

                    set({
                        user: data.user,
                        session: data.session,
                        isAuthenticated: true,
                    });

                    if (data.user) {
                        await get().loadProfile(data.user.id);
                    }

                    set({ isLoading: false });
                    return { error: null };
                } catch (err: any) {
                    console.error("Login error:", err);
                    return { error: err.message || "An unexpected error occurred during login." };
                }
            },

            register: async (email, password, fullName, phone) => {
                try {
                    const supabase = createBrowserSupabaseClient();
                    const { data, error } = await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            data: {
                                full_name: fullName,
                                phone: phone,
                                role: "business_owner",
                            },
                        },
                    });

                    if (error) return { error: error.message };

                    // If email confirmation is disabled, user is returned immediately
                    if (data.user) {
                        set({
                            user: data.user,
                            session: data.session,
                            isAuthenticated: !!data.session,
                        });

                        if (data.session) {
                            await get().loadProfile(data.user.id);
                        }
                    }

                    return { error: null };
                } catch (err: any) {
                    console.error("Registration error:", err);
                    return { error: err.message || "An unexpected error occurred during registration." };
                }
            },

            logout: async () => {
                // Clear Zustand state immediately for instant UI response
                set({
                    user: null,
                    profile: null,
                    session: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
                // Call the server-side logout endpoint to properly clear
                // httpOnly session cookies that the browser client cannot access
                try {
                    await fetch("/api/auth/logout", { method: "POST" });
                } catch (err) {
                    console.error("Server-side logout failed:", err);
                }
            },

            resetPassword: async (email) => {
                const supabase = createBrowserSupabaseClient();
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                });
                return { error: error?.message ?? null };
            },

            updatePassword: async (newPassword) => {
                const supabase = createBrowserSupabaseClient();
                const { error } = await supabase.auth.updateUser({
                    password: newPassword,
                });
                return { error: error?.message ?? null };
            },

            loadProfile: async (userId) => {
                const startTime = Date.now();
                let timeoutId: NodeJS.Timeout | null = null;

                try {
                    console.log(`authStore: [${startTime}] loadProfile starting for userId:`, userId);

                    const timeoutPromise = new Promise((_, reject) => {
                        timeoutId = setTimeout(() => {
                            const elapsed = Date.now() - startTime;
                            console.error(`authStore: [${Date.now()}] loadProfile TIMEOUT after ${elapsed}ms`);
                            reject(new Error("Internal profile load timeout"));
                        }, 10000);
                    });

                    console.log(`authStore: [${Date.now()}] Fetching profile from /api/auth/profile...`);
                    const fetchPromise = fetch("/api/auth/profile").then(res => res.json());

                    const result = await Promise.race([
                        fetchPromise,
                        timeoutPromise
                    ]) as any;

                    // Clear timeout as soon as the race is over (if it was the fetch that won)
                    if (timeoutId) clearTimeout(timeoutId);

                    const elapsed = Date.now() - startTime;
                    console.log(`authStore: [${Date.now()}] Promise resolved in ${elapsed}ms`);

                    if (result.error) {
                        console.error("authStore: Error loading profile via API:", result.error);
                        return;
                    }

                    if (result.profile) {
                        console.log("authStore: Profile data received successfully from API:", result.profile.role);
                        set({ profile: result.profile as Profile });
                    } else {
                        console.warn("authStore: No profile returned in API response", userId);
                    }
                } catch (err) {
                    if (timeoutId) clearTimeout(timeoutId);
                    const elapsed = Date.now() - startTime;
                    console.error(`authStore: [${Date.now()}] Unexpected error/timeout loading profile after ${elapsed}ms:`, err);
                }
            },

            initialize: async () => {
                try {
                    const supabase = createBrowserSupabaseClient();
                    set({ isLoading: true });

                    // Use getUser() instead of getSession() for better security and to avoid warnings
                    const { data: { user }, error } = await supabase.auth.getUser();

                    if (error) {
                        // If no session or error, clear state
                        set({
                            user: null,
                            profile: null,
                            session: null,
                            isAuthenticated: false,
                        });
                        return;
                    }

                    if (user) {
                        // Get the current session to update the store
                        const { data: { session } } = await supabase.auth.getSession();
                        
                        set({
                            user,
                            session,
                            isAuthenticated: true,
                        });
                        await get().loadProfile(user.id);
                    } else {
                        set({
                            user: null,
                            profile: null,
                            session: null,
                            isAuthenticated: false,
                        });
                    }
                } catch (err) {
                    console.error("authStore: Auth initialization error:", err);
                    set({
                        user: null,
                        profile: null,
                        session: null,
                        isAuthenticated: false,
                    });
                } finally {
                    set({ isLoading: false });
                }
            },
        }),
        {
            name: "galapo-auth-store",
            partialize: (state) => ({
                // Only persist minimal user info; session is re-loaded from Supabase
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
