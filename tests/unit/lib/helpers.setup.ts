import { vi } from "vitest";

// Minimal setup for helpers (no MSW needed for pure logic tests)
vi.mock("../../../lib/supabase", () => ({
    createServerSupabaseClient: vi.fn(),
    createAdminSupabaseClient: vi.fn(),
}));
