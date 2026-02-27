// ──────────────────────────────────────────────────────────
// GalaPo — Zustand App Store (v5)
// ──────────────────────────────────────────────────────────

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Search State ────────────────────────────────────────

interface SearchState {
    query: string;
    categoryId: string | null;
    barangay: string | null;
    isSearchOpen: boolean;
}

// ── UI State ────────────────────────────────────────────

interface UIState {
    isMobileMenuOpen: boolean;
    isSidebarOpen: boolean;
    isLoading: boolean;
}

// ── User Preferences ────────────────────────────────────

interface UserPreferences {
    viewMode: "grid" | "list" | "map";
    theme: "light" | "dark" | "system";
}

// ── Combined Store ──────────────────────────────────────

interface AppState extends SearchState, UIState, UserPreferences {
    // Search actions
    setQuery: (query: string) => void;
    setCategoryId: (categoryId: string | null) => void;
    setBarangay: (barangay: string | null) => void;
    toggleSearch: () => void;
    clearSearch: () => void;

    // UI actions
    toggleMobileMenu: () => void;
    toggleSidebar: () => void;
    setLoading: (isLoading: boolean) => void;

    // Preference actions
    setViewMode: (viewMode: "grid" | "list" | "map") => void;
    setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            // ── Search defaults ──
            query: "",
            categoryId: null,
            barangay: null,
            isSearchOpen: false,

            // ── UI defaults ──
            isMobileMenuOpen: false,
            isSidebarOpen: true,
            isLoading: false,

            // ── Preference defaults ──
            viewMode: "grid",
            theme: "system",

            // ── Search actions ──
            setQuery: (query) => set({ query }),
            setCategoryId: (categoryId) => set({ categoryId }),
            setBarangay: (barangay) => set({ barangay }),
            toggleSearch: () => set((s) => ({ isSearchOpen: !s.isSearchOpen })),
            clearSearch: () =>
                set({ query: "", categoryId: null, barangay: null }),

            // ── UI actions ──
            toggleMobileMenu: () =>
                set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
            toggleSidebar: () =>
                set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
            setLoading: (isLoading) => set({ isLoading }),

            // ── Preference actions ──
            setViewMode: (viewMode) => set({ viewMode }),
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: "galapo-app-store",
            partialize: (state) => ({
                viewMode: state.viewMode,
                theme: state.theme,
            }),
        }
    )
);
