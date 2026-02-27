// ──────────────────────────────────────────────────────────
// GalaPo — Next.js Middleware
// ──────────────────────────────────────────────────────────
// Handles:
//   1. Refreshing the Supabase auth session on every request
//   2. Protecting /(business)/* routes (business owners only)
//   3. Protecting /(admin)/* routes (super admins only)
//   4. Allowing all /(public)/* routes without auth

import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareSupabaseClient } from "@/lib/supabase-middleware";

// Routes that require a business owner role
const BUSINESS_ROUTES = /^\/(dashboard|business)(\/|$)/;

// Routes that require a super admin role
const ADMIN_ROUTES = /^\/(admin)(\/|$)/;

export async function middleware(request: NextRequest) {
    const { supabase, response } = createMiddlewareSupabaseClient(request);

    // Refresh the session — this updates cookies even for public routes.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // ── Protect Business Routes ─────────────────────────────
    if (BUSINESS_ROUTES.test(pathname)) {
        if (!user) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("redirect", pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Check role from user metadata
        const role = user.user_metadata?.role;
        if (role !== "business_owner" && role !== "super_admin") {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("redirect", pathname);
            loginUrl.searchParams.set("error", "unauthorized");
            return NextResponse.redirect(loginUrl);
        }
    }

    // ── Protect Admin Routes ────────────────────────────────
    if (ADMIN_ROUTES.test(pathname)) {
        if (!user) {
            const loginUrl = new URL("/admin/login", request.url);
            loginUrl.searchParams.set("redirect", pathname);
            return NextResponse.redirect(loginUrl);
        }

        const role = user.user_metadata?.role;
        if (role !== "super_admin") {
            const loginUrl = new URL("/admin/login", request.url);
            loginUrl.searchParams.set("error", "unauthorized");
            return NextResponse.redirect(loginUrl);
        }
    }

    // ── Allow public routes — return the response with updated cookies
    return response;
}

export const config = {
    matcher: [
        /*
         * Match all routes except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico, sitemap.xml, robots.txt
         * - Public assets (icons, images, etc.)
         */
        "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|icons/|manifest\\.json|sw\\.js|workbox-.*).*)",
    ],
};
