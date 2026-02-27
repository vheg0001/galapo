// ──────────────────────────────────────────────────────────
// GalaPo — API Helpers
// ──────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

/**
 * Returns a standardized success response format.
 */
export function successResponse(data: any, status = 200) {
    return NextResponse.json({ success: true, data }, { status });
}

/**
 * Returns a standardized error response format.
 */
export function errorResponse(message: string, status = 400) {
    console.error(`[API Error ${status}]:`, message);
    return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * Returns a standardized paginated response format.
 */
export function paginatedResponse(data: any[], total: number, page: number, limit: number) {
    return NextResponse.json(
        {
            success: true,
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1,
            },
        },
        { status: 200 }
    );
}

/**
 * Extracts and returns the authenticated user from the current request.
 * Useful for endpoint protection.
 */
export async function getCurrentUser() {
    try {
        const supabase = await createServerSupabaseClient();
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error || !user) {
            return null;
        }

        return user;
    } catch (e) {
        return null;
    }
}

/**
 * Ensures the request is authenticated. 
 * If not, returns a 401 Unauthorized response.
 * Use this at the top of protected route handlers.
 */
export async function requireAuth() {
    const user = await getCurrentUser();

    if (!user) {
        return {
            authorized: false,
            response: errorResponse("Unauthorized: Missing or invalid authentication token.", 401),
            user: null,
        };
    }

    return { authorized: true, user, response: null };
}

/**
 * Ensures the request is from a Super Admin.
 * Uses the Service Role to bypass RLS and check user roles.
 */
export async function requireAdmin() {
    const user = await getCurrentUser();

    if (!user) {
        return {
            authorized: false,
            response: errorResponse("Unauthorized: Missing or invalid authentication token.", 401),
            user: null,
        };
    }

    try {
        const adminSupabase = createAdminSupabaseClient();

        const { data: userData, error } = await adminSupabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

        if (error || userData?.role !== "super_admin") {
            return {
                authorized: false,
                response: errorResponse("Forbidden: Administrator access required.", 403),
                user,
            };
        }

        return { authorized: true, user, response: null };
    } catch (e) {
        return {
            authorized: false,
            response: errorResponse("Internal server error during authorization.", 500),
            user: null,
        };
    }
}
