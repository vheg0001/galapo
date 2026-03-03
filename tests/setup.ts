import "@testing-library/jest-dom";
import { beforeAll, afterEach, afterAll, vi } from "vitest";
import { server } from "./mocks/server";

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => {
    server.resetHandlers();

    // Cleanup DOM after each test
    document.body.innerHTML = '';
});

// Clean up after the tests are finished
afterAll(() => server.close());

// Mock window.matchMedia which is not present in JSDOM
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
        pathname: '/',
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}));

// Global Supabase Mock for Integration Tests
vi.mock("@/lib/supabase", () => {
    const queryChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: [], error: null, count: 0 })),
    };

    const mockSupabase = {
        auth: {
            getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'mock-user-id' } }, error: null })),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
            updateUser: vi.fn(),
            getSession: vi.fn(),
        },
        from: vi.fn(() => queryChain),
        storage: {
            from: vi.fn().mockReturnValue({
                upload: vi.fn().mockResolvedValue({ data: { path: 'mock-path' }, error: null }),
                getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'http://example.com/mock.jpg' } }),
            }),
        },
        rpc: vi.fn().mockResolvedValue({ data: { listings: [], total: 0 }, error: null }),
        _queryChain: queryChain,
    };

    return {
        createServerSupabaseClient: vi.fn(() => Promise.resolve(mockSupabase)),
        createAdminSupabaseClient: vi.fn(() => Promise.resolve(mockSupabase)),
        mockSupabase,
    };
});
