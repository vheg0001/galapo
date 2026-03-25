import { createServerSupabaseClient } from "./supabase";
import { type Profile } from "@/store/authStore";
import { type NextRequest, NextResponse } from "next/server";

// ──────────────────────────────────────────────────────────
// GalaPo — Server Auth Helpers (Module 7.2)
// ──────────────────────────────────────────────────────────

/**
 * Retrieves the current authenticated session on the server.
 */
/**
 * Retrieves the current authenticated user on the server (SECURE).
 * Always use this instead of getSession() for authentication checks.
 */
export async function getServerUser() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) return null;
        return user;
    } catch (error) {
        console.error("getServerUser exception:", error);
        return null;
    }
}

/**
 * Retrieves the current authenticated session on the server.
 * Note: Use getServerUser() if you only need the user object.
 */
export async function getServerSession() {
    try {
        const supabase = await createServerSupabaseClient();
        // Force session refresh/validation via getUser()
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
            return null;
        }

        // Return the session only after we've verified the user exists
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) return null;
        
        return session;
    } catch (error) {
        console.error("getServerSession exception:", error);
        return null;
    }
}

export async function getServerProfile(): Promise<Profile | null> {
    const start = Date.now();
    try {
        console.log(`getServerProfile: Starting at ${start}`);
        
        // Use getServerUser directly to save one Auth API call
        const user = await getServerUser();
        if (!user?.id) {
            console.log(`getServerProfile: No user found, elapsed ${Date.now() - start}ms`);
            return null;
        }

        console.log(`getServerProfile: User verified (${user.id}), fetching profile from DB. Elapsed ${Date.now() - start}ms`);

        // Use admin client to bypass RLS hangs/recursion on the profiles table
        const { createAdminSupabaseClient } = await import("./supabase");
        const admin = createAdminSupabaseClient();

        const { data: profile, error } = await admin
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        const end = Date.now();
        if (error) {
            console.error(`getServerProfile error after ${end - start}ms:`, error);
            return null;
        }

        console.log(`getServerProfile: Success! Total elapsed ${end - start}ms`);
        return profile as Profile | null;
    } catch (err) {
        console.error(`getServerProfile critical exception after ${Date.now() - start}ms:`, err);
        return null;
    }
}

/**
 * Middleware helper for API routes to require a business owner session.
 * Usage:
 * const auth = await requireBusinessOwner(request);
 * if ('error' in auth) return auth.error; // Returns NextResponse directly on failure
 * const { user, profile } = auth;
 */
export async function requireBusinessOwner(request: NextRequest) {
    const session = await getServerSession();
    if (!session?.user) {
        return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    const profile = await getServerProfile();
    if (!profile || (profile.role !== "business_owner" && profile.role !== "super_admin")) {
        return { error: NextResponse.json({ error: "Forbidden - Business Owner Access Required" }, { status: 403 }) };
    }

    if (!profile.is_active) {
        return { error: NextResponse.json({ error: "Forbidden - Account Disabled" }, { status: 403 }) };
    }

    return { user: session.user, profile };
}

/**
 * Middleware helper for API routes to require an admin session.
 */
export async function requireAdmin(request: NextRequest) {
    const session = await getServerSession();
    if (!session?.user) {
        return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    const profile = await getServerProfile();
    if (!profile || profile.role !== "super_admin") {
        return { error: NextResponse.json({ error: "Forbidden - Admin Access Required" }, { status: 403 }) };
    }

    if (!profile.is_active) {
        return { error: NextResponse.json({ error: "Forbidden - Account Disabled" }, { status: 403 }) };
    }

    return { user: session.user, profile };
}

// ──────────────────────────────────────────────────────────
// Validation Helpers
// ──────────────────────────────────────────────────────────

/**
 * Validates an email address.
 */
export function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validates a Philippine phone number.
 * Accepts formats like: 09171234567, +639171234567, 0917-123-4567, etc.
 */
export function validatePhone(phone: string): boolean {
    const cleaned = phone.replace(/[\s-]/g, "");
    return /^(\+63|0)9\d{9}$/.test(cleaned);
}

/**
 * Validates password strength.
 * Returns a score and specific message if weak.
 */
export function validatePassword(password: string): { isValid: boolean; strength: "weak" | "medium" | "strong"; message: string } {
    if (!password || password.length < 8) {
        return { isValid: false, strength: "weak", message: "Password must be at least 8 characters long." };
    }

    let score = 0;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score === 0) {
        return { isValid: false, strength: "weak", message: "Password is too weak. Add uppercase letters, numbers, or symbols." };
    }

    if (score <= 2) {
        return { isValid: true, strength: "medium", message: "Medium password strength." };
    }

    return { isValid: true, strength: "strong", message: "Strong password." };
}
