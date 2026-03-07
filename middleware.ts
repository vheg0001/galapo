// ──────────────────────────────────────────────────────────
// GalaPo — Next.js Middleware
// ──────────────────────────────────────────────────────────
// Handles:
//   1. Refreshing the Supabase auth session on every request
//   2. Protecting /(business)/* routes (business owners only)
//   3. Protecting /(admin)/* routes (super admins only)
//   4. Allowing all /(public)/* routes without auth
//   5. Maintenance Mode redirection

import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareSupabaseClient } from "@/lib/supabase-middleware";

// Routes that require a business owner role
const BUSINESS_ROUTES = /^\/business(\/|$)/;

// Routes that require a super admin role
const ADMIN_ROUTES = /^\/(admin)(\/|$)/;

// Routes that require login but redirect to /register (claims)
const CLAIM_ROUTES = /^\/(claim)(\/|$)/;

export async function middleware(request: NextRequest) {
    const { supabase, response } = createMiddlewareSupabaseClient(request);

    const { pathname } = request.nextUrl;
    const isAdminLoginRoute = pathname === "/admin/login";
    const isMaintenanceRoute = pathname === "/maintenance";
    const isBusinessRoute = BUSINESS_ROUTES.test(pathname);
    const isAdminRoute = ADMIN_ROUTES.test(pathname) && !isAdminLoginRoute;
    const isClaimRoute = CLAIM_ROUTES.test(pathname);

    // ── Maintenance Mode Check ─────────────────────────────
    // Apply to all routes except: maintenance page, admin login, and API routes
    if (!isMaintenanceRoute && !isAdminLoginRoute && !pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
        const { data: maintenanceSetting } = await supabase
            .from("site_settings")
            .select("value")
            .eq("key", "maintenance_mode")
            .maybeSingle();

        const isMaintenanceOn = maintenanceSetting?.value === true || maintenanceSetting?.value === "true";

        if (isMaintenanceOn) {
            const { data: { user } } = await supabase.auth.getUser();
            let isAdmin = false;

            if (user) {
                // Trust metadata first for speed, fallback to profile
                isAdmin = user.user_metadata?.role === "super_admin";
                if (!isAdmin) {
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("role")
                        .eq("id", user.id)
                        .maybeSingle();
                    isAdmin = profile?.role === "super_admin";
                }
            }

            if (!isAdmin) {
                return NextResponse.redirect(new URL("/maintenance", request.url));
            }
        }
    }

    // ── Only validate session/user for protected routes ─────
    if (isBusinessRoute || isAdminRoute || isClaimRoute) {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        // Protect Claim Routes (Guest -> /register)
        if (isClaimRoute && !user) {
            const registerUrl = new URL("/register", request.url);
            registerUrl.searchParams.set("redirect", pathname);
            return NextResponse.redirect(registerUrl);
        }

        // Protect Business Routes
        if (isBusinessRoute) {
            if (!user) {
                const loginUrl = new URL("/login", request.url);
                loginUrl.searchParams.set("redirect", pathname);
                return NextResponse.redirect(loginUrl);
            }

            let role = user.user_metadata?.role as string | undefined;
            if (!role) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();
                role = profile?.role;
            }
            if (role !== "business_owner" && role !== "super_admin") {
                const loginUrl = new URL("/login", request.url);
                loginUrl.searchParams.set("redirect", pathname);
                loginUrl.searchParams.set("error", "unauthorized");
                return NextResponse.redirect(loginUrl);
            }
        }

        // Protect Admin Routes
        if (isAdminRoute) {
            if (!user) {
                const loginUrl = new URL("/admin/login", request.url);
                loginUrl.searchParams.set("redirect", pathname);
                return NextResponse.redirect(loginUrl);
            }

            let role = user.user_metadata?.role as string | undefined;
            if (!role) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();
                role = profile?.role;
            }
            if (role !== "super_admin") {
                const loginUrl = new URL("/admin/login", request.url);
                loginUrl.searchParams.set("redirect", pathname);
                loginUrl.searchParams.set("error", "unauthorized");
                return NextResponse.redirect(loginUrl);
            }
        }
    }

    // ── Allow public routes/assets — return the response quickly
    // Set custom header so server components (layouts) can access the pathname
    response.headers.set("x-pathname", pathname);
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
