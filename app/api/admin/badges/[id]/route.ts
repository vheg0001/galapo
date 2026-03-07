import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const admin = createAdminSupabaseClient();

    try {
        const { data: badge, error: badgeError } = await admin
            .from("badges")
            .select("*")
            .eq("id", id)
            .single();

        if (badgeError) throw badgeError;

        // Fetch counts for this badge from listing_badges
        const { count, error: countError } = await admin
            .from("listing_badges")
            .select("id", { count: "exact", head: true })
            .eq("badge_id", id)
            .eq("is_active", true);

        if (countError) throw countError;

        return NextResponse.json({
            data: {
                ...badge,
                assigned_count: count || 0
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const admin = createAdminSupabaseClient();

    try {
        const body = await request.json();
        const {
            name, slug, description, icon, icon_lucide,
            color, text_color, type, priority,
            auto_expires, default_expiry_days,
            is_filterable, is_active
        } = body;

        // Check if badge exists and its type (plan/system badges have restrictions)
        const { data: existing, error: existError } = await admin
            .from("badges")
            .select("type, slug")
            .eq("id", id)
            .single();

        if (existError) throw existError;

        // Restriction: Plan badges cannot change type
        if (existing.type === "plan" && type && type !== "plan") {
            return NextResponse.json({ error: "Cannot change the type of a plan badge." }, { status: 403 });
        }

        // Check unique slug if changed
        if (slug && slug !== existing.slug) {
            const { data: slugExisting } = await admin
                .from("badges")
                .select("id")
                .eq("slug", slug)
                .maybeSingle();

            if (slugExisting) {
                return NextResponse.json({ error: "A badge with this slug already exists." }, { status: 409 });
            }
        }

        const { data, error } = await admin
            .from("badges")
            .update({
                name,
                slug,
                description,
                icon,
                icon_lucide,
                color,
                text_color,
                type,
                priority,
                auto_expires,
                default_expiry_days,
                is_filterable,
                is_active,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const admin = createAdminSupabaseClient();

    try {
        // Fetch badge to check type and assigned count
        const { data: badge, error: badgeError } = await admin
            .from("badges")
            .select("type")
            .eq("id", id)
            .maybeSingle();

        if (badgeError) throw badgeError;
        if (!badge) {
            return NextResponse.json({ error: "Badge not found." }, { status: 404 });
        }

        // Restriction: Plan badges cannot be deleted
        if (badge.type === "plan") {
            return NextResponse.json({ error: "Plan badges cannot be deleted." }, { status: 403 });
        }

        // Check assigned count
        const { count, error: countError } = await admin
            .from("listing_badges")
            .select("id", { count: "exact", head: true })
            .eq("badge_id", id);
        // Even inactive assignments block deletion for history? 
        // Prompt says: Delete only allowed if assigned_count = 0.
        // Usually this means database referential integrity will catch it anyway if there are rows in listing_badges.

        if (countError) throw countError;

        if (count && count > 0) {
            return NextResponse.json({
                error: `This badge is assigned to ${count} listings. Remove those assignments before deleting.`,
                assigned_count: count
            }, { status: 409 });
        }

        const { error } = await admin
            .from("badges")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
