import { createServerSupabaseClient } from "./supabase";
import { type Profile } from "@/store/authStore";
import { type NextRequest, NextResponse } from "next/server";

// ──────────────────────────────────────────────────────────
// GalaPo — Server Auth Helpers (Module 7.2)
// ──────────────────────────────────────────────────────────

/**
 * Retrieves the current authenticated session on the server.
 */
export async function getServerSession() {
    const supabase = await createServerSupabaseClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();
    return session;
}

/**
 * Retrieves the current authenticated user's profile on the server.
 */
export async function getServerProfile(): Promise<Profile | null> {
    const session = await getServerSession();
    if (!session?.user?.id) return null;

    const supabase = await createServerSupabaseClient();
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

    return profile as Profile | null;
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
