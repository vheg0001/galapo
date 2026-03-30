import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const admin = createAdminSupabaseClient();

    try {
        // Fetch all badges ordered by priority then name
        const { data: badges, error: badgeError } = await admin
            .from("badges")
            .select("*")
            .order("priority", { ascending: true })
            .order("name", { ascending: true });

        if (badgeError) throw badgeError;

        // Fetch counts for each badge from listing_badges
        const { data: counts, error: countError } = await admin
            .from("listing_badges")
            .select("badge_id")
            .eq("is_active", true);

        if (countError) throw countError;

        const countMap: Record<string, number> = {};
        counts?.forEach((lb) => {
            countMap[lb.badge_id] = (countMap[lb.badge_id] || 0) + 1;
        });

        const badgesWithCounts = (badges ?? []).map((b) => ({
            ...b,
            assigned_count: countMap[b.id] || 0,
        }));

        return NextResponse.json({ data: badgesWithCounts });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const admin = createAdminSupabaseClient();

    try {
        const body = await request.json();
        const {
            name, slug, description, icon, icon_lucide,
            color, text_color, type, priority,
            auto_expires, default_expiry_days,
            is_filterable, is_active, animation_color
        } = body;

        if (!name || !slug || (!icon && !icon_lucide) || !color) {
            return NextResponse.json({ error: "Name, slug, an icon, and color are required." }, { status: 400 });
        }

        // Check if slug is unique
        const { data: existing } = await admin
            .from("badges")
            .select("id")
            .eq("slug", slug)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ error: "A badge with this slug already exists." }, { status: 409 });
        }

        const { data, error } = await admin
            .from("badges")
            .insert({
                name,
                slug,
                description: description || null,
                icon,
                icon_lucide: icon_lucide || null,
                color,
                text_color: text_color || "#FFFFFF",
                type: type || "admin",
                priority: priority ?? 50,
                auto_expires: auto_expires ?? false,
                default_expiry_days: auto_expires ? (default_expiry_days || 30) : null,
                is_filterable: is_filterable ?? true,
                is_active: is_active ?? true,
                animation_type: body.animation_type || "none",
                animation_color: animation_color || null,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ data }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
