import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const admin = createAdminSupabaseClient();

    try {
        const { data, error } = await admin
            .from("site_settings")
            .select("key, value, description");

        if (error) throw error;

        // Convert array to key-value map
        const settings: Record<string, any> = {};
        (data ?? []).forEach((row) => {
            // Supabase returns JSONB columns already parsed as JS objects/primitives
            settings[row.key] = row.value;
        });

        return NextResponse.json({ data: settings });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const admin = createAdminSupabaseClient();

    try {
        const body = await request.json();

        if (!body || typeof body !== "object") {
            return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
        }

        // Validate known keys (synced with frontend price keys)
        const numericKeys = [
            "price_basic", "premium_listing_monthly_price", "featured_listing_monthly_price",
            "price_claim", "reactivation_fee_amount", "ad_placement_monthly_price", "top_search_monthly_price",
        ];
        const urlKeys = ["og_image_url", "site_logo_url", "site_favicon_url"];
        const adsensePattern = /^(ca-pub-\d+)?$/;

        const validationErrors: string[] = [];

        for (const [key, value] of Object.entries(body)) {
            if (numericKeys.includes(key)) {
                const num = Number(value);
                if (isNaN(num) || num < 0) {
                    validationErrors.push(`${key} must be a non-negative number.`);
                }
            }
            if (urlKeys.includes(key) && value && typeof value === "string") {
                try { new URL(value as string); } catch {
                    validationErrors.push(`${key} must be a valid URL.`);
                }
            }
            if (key === "adsense_publisher_id" && value && typeof value === "string") {
                if (!adsensePattern.test(value as string)) {
                    validationErrors.push(`adsense_publisher_id must be in format ca-pub-XXXXXXXXXXXXXXXX.`);
                }
            }
        }

        if (validationErrors.length > 0) {
            return NextResponse.json({ error: validationErrors.join(" ") }, { status: 400 });
        }

        // Upsert each key in the body
        const upserts = Object.entries(body).map(([key, value]) => ({
            key,
            value: value, // Supabase JS client handles serialization to JSONB automatically
            updated_at: new Date().toISOString(),
        }));

        const { error } = await admin
            .from("site_settings")
            .upsert(upserts, { onConflict: "key" });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT alias so both PATCH and PUT are supported
export const PUT = PATCH;
