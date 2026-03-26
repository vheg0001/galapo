// ──────────────────────────────────────────────────────────
// GalaPo — Zustand Auth Store (Module 7.1)
// ──────────────────────────────────────────────────────────

import { create } from "zustand";
import type { User, Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase";

console.log("authStore: SCRIPT LOADING AT TOP LEVEL");

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
    isProfileLoading: boolean;
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

export const useAuthStore = create<AuthState>()((set, get) => ({
    user: null,
    profile: null,
    session: null,
    isLoading: true, // Default to true so AuthGuard waits for initialize() to run
    isProfileLoading: false,
    isAuthenticated: false,

    setUser: (user) => set({ user, isAuthenticated: !!user }),
    setProfile: (profile) => set({ profile }),
    setSession: (session) => set({ session, isAuthenticated: !!session }),
    setLoading: (isLoading) => set({ isLoading }),

    login: async (email, password) => {
        try {
            const supabase = createBrowserSupabaseClient();
            set({ isLoading: true });
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                set({ isLoading: false });
                return { error: error.message };
            }

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
            set({ isLoading: false });
            return { error: err.message || "An unexpected error occurred." };
        }
    },

    register: async (email, password, fullName, phone) => {
        try {
            const supabase = createBrowserSupabaseClient();
            set({ isLoading: true });
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

            if (error) {
                set({ isLoading: false });
                return { error: error.message };
            }

            set({
                user: data.user,
                session: data.session,
                isAuthenticated: !!data.session,
            });

            set({ isLoading: false });
            return { error: null };
        } catch (err: any) {
            console.error("Registration error:", err);
            set({ isLoading: false });
            return { error: err.message || "An unexpected error occurred." };
        }
    },

    logout: async () => {
        const supabase = createBrowserSupabaseClient();
        await supabase.auth.signOut();
        set({
            user: null,
            profile: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
        });
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
        if (get().isProfileLoading) return;
        const startTime = Date.now();
        let timeoutId: any = null;

        try {
            set({ isProfileLoading: true });
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    reject(new Error("Internal profile load timeout"));
                }, 20000);
            });

            const fetchPromise = fetch("/api/auth/profile").then(res => res.json());
            const result = await Promise.race([fetchPromise, timeoutPromise]) as any;

            if (timeoutId) clearTimeout(timeoutId);

            if (result.profile) {
                set({ profile: result.profile as Profile });
            }
        } catch (err) {
            console.error("loadProfile error:", err);
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
            set({ isProfileLoading: false });
        }
    },

    initialize: async () => {
        const initStartTime = Date.now();
        let initTimeoutId: any = null;
        
        try {
            console.log(`authStore: [${initStartTime}] initialize starting...`);
            const supabase = createBrowserSupabaseClient();
            set({ isLoading: true });

            const initTimeoutPromise = new Promise((_, reject) => {
                initTimeoutId = setTimeout(() => {
                    reject(new Error("Auth initialization timeout"));
                }, 15000);
            });

            console.log(`authStore: [${Date.now()}] Fetching user via supabase.auth.getUser()...`);
            const { data: { user }, error } = await Promise.race([
                supabase.auth.getUser(),
                initTimeoutPromise
            ]) as any;

            if (initTimeoutId) clearTimeout(initTimeoutId);

            if (error || !user) {
                console.log("authStore: User not found or error in initialize");
                set({ user: null, profile: null, session: null, isAuthenticated: false });
            } else {
                console.log("authStore: User identified, starting background profile load...");
                set({ user, isAuthenticated: true });
                get().loadProfile(user.id); // Non-blocking
            }
        } catch (err) {
            if (initTimeoutId) clearTimeout(initTimeoutId);
            console.error("authStore: Auth initialization critical hang/error:", err);
            set({ user: null, profile: null, session: null, isAuthenticated: false });
        } finally {
            set({ isLoading: false });
            console.log(`authStore: [${Date.now()}] initialize complete in ${Date.now() - initStartTime}ms`);
        }
    },
}));
