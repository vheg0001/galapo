/// <reference types="vitest/globals" />

import "@testing-library/jest-dom";
import * as React from "react";
import { server } from "./mocks/server";

// Establish API mocking before all tests
beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
    server.resetHandlers();
});

afterAll(() => server.close());

// Pure JS mocks for globals (No JSX)
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
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
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: (cb: any) => cb({ data: [], error: null }),
    };

    const mockSupabase = {
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'mock' } }, error: null }),
            getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'mock' } } }, error: null }),
        },
        from: vi.fn(() => chain),
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
        storage: { from: vi.fn(() => ({ getPublicUrl: vi.fn(() => ({ data: { publicUrl: '' } })) })) },
    };

    return {
        createServerSupabaseClient: vi.fn(() => Promise.resolve(mockSupabase)),
        createAdminSupabaseClient: vi.fn(() => mockSupabase),
    };
});
