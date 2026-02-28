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

                return { error: null };
            },

            register: async (email, password, fullName, phone) => {
                const supabase = createBrowserSupabaseClient();
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            role: "business_owner",
                        },
                    },
                });

                if (error) return { error: error.message };

                // If email confirmation is disabled, user is returned immediately
                if (data.user) {
                    // Update phone in profile
                    const { error: profileError } = await supabase
                        .from("profiles")
                        .update({ phone, full_name: fullName })
                        .eq("id", data.user.id);

                    if (profileError) {
                        console.error("Profile update error:", profileError);
                    }

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
            },

            logout: async () => {
                const supabase = createBrowserSupabaseClient();
                await supabase.auth.signOut();
                set({
                    user: null,
                    profile: null,
                    session: null,
                    isAuthenticated: false,
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
                const supabase = createBrowserSupabaseClient();
                const { data } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", userId)
                    .single();

                if (data) {
                    set({ profile: data as Profile });
                }
            },

            initialize: async () => {
                const supabase = createBrowserSupabaseClient();
                set({ isLoading: true });

                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    set({
                        user: session.user,
                        session,
                        isAuthenticated: true,
                    });
                    await get().loadProfile(session.user.id);
                } else {
                    set({
                        user: null,
                        profile: null,
                        session: null,
                        isAuthenticated: false,
                    });
                }

                set({ isLoading: false });
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
