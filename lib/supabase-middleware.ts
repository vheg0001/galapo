// ──────────────────────────────────────────────────────────
// GalaPo — Supabase Middleware Helper
// ──────────────────────────────────────────────────────────
// Creates a Supabase client that can refresh auth sessions
// inside Next.js middleware (which cannot use `next/headers`).

import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

/**
 * Creates a Supabase client for use within Next.js middleware.
 * Reads/writes auth cookies directly on the request/response pair.
 *
 * Returns `{ supabase, response }` — always return the **response**
 * from your middleware so updated cookies are forwarded to the browser.
 */
export function createMiddlewareSupabaseClient(request: NextRequest) {
    // Start with a plain "next" response that we can append cookies to.
    let response = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll: (cookiesToSet) => {
                    // Set cookies on both the request (for downstream reads)
                    // and the response (for the browser).
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );

                    // Re-create the response so it picks up the updated request cookies.
                    response = NextResponse.next({ request });

                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    return { supabase, response };
}
