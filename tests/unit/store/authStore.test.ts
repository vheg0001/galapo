import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "@/store/authStore";
import { mockSupabaseClient } from "../../mocks/supabase";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
    createBrowserSupabaseClient: () => mockSupabaseClient,
}));

// Mock global fetch
global.fetch = vi.fn();

describe("authStore", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset store state
        useAuthStore.setState({
            user: null,
            profile: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
        });
    });

    it("login() sets user and session on success", async () => {
        const mockUser = { id: "123", email: "test@example.com" };
        const mockSession = { user: mockUser };

        mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
            data: { user: mockUser, session: mockSession },
            error: null,
        });

        // Mock loadProfile call which is triggered by login
        const mockProfile = { id: "123", full_name: "Test User", role: "business_owner" };
        mockSupabaseClient.from.mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        });

        const result = await useAuthStore.getState().login("test@example.com", "password");

        expect(result.error).toBeNull();
        const state = useAuthStore.getState();
        expect(state.user).toEqual(mockUser);
        expect(state.session).toEqual(mockSession);
        expect(state.isAuthenticated).toBe(true);
        expect(state.profile).toEqual(mockProfile);
    });

    it("logout() clears all auth state", async () => {
        useAuthStore.setState({
            user: { id: "123" } as any,
            profile: { id: "123" } as any,
            session: { user: {} } as any,
            isAuthenticated: true,
        });

        mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });

        await useAuthStore.getState().logout();

        const state = useAuthStore.getState();
        expect(state.user).toBeNull();
        expect(state.profile).toBeNull();
        expect(state.session).toBeNull();
        expect(state.isAuthenticated).toBe(false);
    });

    it("isAuthenticated returns correct status", () => {
        expect(useAuthStore.getState().isAuthenticated).toBe(false);

        useAuthStore.setState({ isAuthenticated: true });
        expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it("initialize() fetches session and profile", async () => {
        const mockUser = { id: "123" };
        const mockSession = { user: mockUser };
        const mockProfile = { id: "123", role: "business_owner" };

        mockSupabaseClient.auth.getSession.mockResolvedValue({
            data: { session: mockSession },
            error: null,
        });

        mockSupabaseClient.from.mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        });

        await useAuthStore.getState().initialize();

        const state = useAuthStore.getState();
        expect(state.user).toEqual(mockUser);
        expect(state.session).toEqual(mockSession);
        expect(state.profile).toEqual(mockProfile);
        expect(state.isLoading).toBe(false);
    });
});
