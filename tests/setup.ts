import "@testing-library/jest-dom";
import { beforeAll, afterEach, afterAll, vi } from "vitest";
import { server } from "./mocks/server";

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => {
    server.resetHandlers();
    // document.body.innerHTML = ''; // Removed to avoid interfering with Vitest/RTL's own cleanup
});

// Clean up after the tests are finished
afterAll(() => server.close());

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(() => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
        pathname: '/',
    })),
    usePathname: vi.fn(() => "/"),
    useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Robust Global Supabase Mock
vi.mock("@/lib/supabase", () => {
    const chain: any = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(() => Promise.resolve({ data: null, error: null })),
        maybeSingle: vi.fn().mockImplementation(() => Promise.resolve({ data: null, error: null })),
        then: vi.fn().mockImplementation(function (onFulfilled) {
            return Promise.resolve({ data: [], error: null }).then(onFulfilled);
        }),
    };

    const mockSupabase = {
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'mock-user-id' } }, error: null }),
            getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'mock-user-id' } } }, error: null }),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
            updateUser: vi.fn(),
        },
        from: vi.fn(() => chain),
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
        storage: {
            from: vi.fn().mockReturnValue({
                upload: vi.fn().mockResolvedValue({ data: { path: 'mock-path' }, error: null }),
                getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'http://example.com/mock.jpg' } }),
            }),
        },
        _chain: chain,
    };

    return {
        createServerSupabaseClient: vi.fn(() => Promise.resolve(mockSupabase)),
        createAdminSupabaseClient: vi.fn(() => mockSupabase), // Sync as per lib/supabase.ts
        mockSupabase,
    };
});
