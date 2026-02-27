// ──────────────────────────────────────────────────────────
// GalaPo — Supabase Client Configuration
// ──────────────────────────────────────────────────────────

import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// ── Environment Variables ───────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ── Browser Client (Client Components) ─────────────────
/**
 * Use this in client components (`"use client"`).
 * Automatically handles cookie-based auth sessions via `@supabase/ssr`.
 */
export function createBrowserSupabaseClient() {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// ── Server Client (Server Components & Route Handlers) ──
/**
 * Use this in server components, server actions, and route handlers.
 * Requires the `cookies()` async function from `next/headers`.
 *
 * @example
 * ```ts
 * import { createServerSupabaseClient } from "@/lib/supabase";
 * const supabase = await createServerSupabaseClient();
 * const { data } = await supabase.from("businesses").select("*");
 * ```
 */
export async function createServerSupabaseClient() {
    const { createServerClient } = await import("@supabase/ssr");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();

    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll: () => cookieStore.getAll(),
            setAll: (cookiesToSet) => {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                } catch {
                    // setAll is called from a Server Component where cookies
                    // cannot be set — this is expected and can be safely ignored.
                }
            },
        },
    });
}

// ── Admin Client (Service Role — Server Only) ───────────
/**
 * Use this ONLY on the server for admin operations that bypass RLS.
 * NEVER expose the service role key to the client.
 *
 * @example
 * ```ts
 * import { createAdminSupabaseClient } from "@/lib/supabase";
 * const admin = createAdminSupabaseClient();
 * const { data } = await admin.from("users").select("*");
 * ```
 */
export function createAdminSupabaseClient() {
    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
