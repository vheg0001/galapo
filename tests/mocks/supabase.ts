import { vi } from "vitest";

// Common mock for Supabase Select queries
export const mockSelect = vi.fn().mockReturnThis();

// Common mock for Supabase filtering operations
export const mockEq = vi.fn().mockReturnThis();
export const mockNeq = vi.fn().mockReturnThis();
export const mockIn = vi.fn().mockReturnThis();
export const mockContains = vi.fn().mockReturnThis();

// Common mock for Supabase pagination/ordering
export const mockOrder = vi.fn().mockReturnThis();
export const mockRange = vi.fn().mockReturnThis();

// Common mock for mutation operations
export const mockInsert = vi.fn().mockReturnThis();
export const mockUpdate = vi.fn().mockReturnThis();
export const mockDelete = vi.fn().mockReturnThis();

// Common mock for execution
// Default mock returns generic success, can be overridden per test
export const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
export const mockExecute = vi.fn().mockResolvedValue({ data: [], error: null });

// Mock for Storage operations
export const mockUpload = vi.fn().mockResolvedValue({ data: { path: "mock-path" }, error: null });
export const mockRemove = vi.fn().mockResolvedValue({ data: {}, error: null });
export const mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: "https://mock-supabase-url.com/storage/v1/object/public/mock-bucket/mock-path" } });

// Main storage mock
export const mockStorageFrom = vi.fn().mockReturnValue({
    upload: mockUpload,
    remove: mockRemove,
    getPublicUrl: mockGetPublicUrl,
});

// Setup the base query builder chain
export const mockQueryBuilder = {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    neq: mockNeq,
    in: mockIn,
    contains: mockContains,
    order: mockOrder,
    range: mockRange,
    single: mockSingle,
    // Provide a generic array-like interface as the fallback for await execution
    then: function (resolve: any) {
        return mockExecute().then(resolve);
    },
};

// Main from() mock
export const mockFrom = vi.fn().mockReturnValue(mockQueryBuilder);

// Mock implementation of the main Supabase client
export const mockSupabaseClient = {
    from: mockFrom,
    storage: {
        from: mockStorageFrom,
    },
    auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        signInWithPassword: vi.fn().mockResolvedValue({ data: { user: {}, session: {} }, error: null }),
        signUp: vi.fn().mockResolvedValue({ data: { user: {}, session: {} }, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
        updateUser: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
    },
};

// This is the actual shape export used to override the module
export const mockCreateBrowserSupabaseClient = vi.fn(() => mockSupabaseClient);
export const mockCreateServerSupabaseClient = vi.fn(() => mockSupabaseClient);
export const mockCreateAdminSupabaseClient = vi.fn(() => mockSupabaseClient);
