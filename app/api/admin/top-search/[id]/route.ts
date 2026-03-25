import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAdmin(req);
        if ("error" in auth) return auth.error;
        const { id } = await params;
        const supabase = await createServerSupabaseClient();

        const { data, error } = await supabase
            .from("top_search_placements")
            .select(`
                *,
                listings ( id, business_name, slug, owner_id ),
                categories ( id, name, slug )
            `)
            .eq("id", id)
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("Top Search Detail GET error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAdmin(req);
        if ("error" in auth) return auth.error;
        const { id } = await params;
        const body = await req.json();
        const { action, days, reason, effective } = body;
        const supabase = await createServerSupabaseClient();

        const { data: current } = await supabase.from("top_search_placements").select("*").eq("id", id).single();
        if (!current) throw new Error("Placement not found");

        if (action === "extend") {
            const newEndDate = new Date(current.end_date);
            newEndDate.setDate(newEndDate.getDate() + (days || 7));
            
            const { error } = await supabase
                .from("top_search_placements")
                .update({ end_date: newEndDate.toISOString() })
                .eq("id", id);
            
            if (error) throw error;
        } else if (action === "remove") {
            if (effective === "immediate") {
                await supabase.from("top_search_placements").update({ is_active: false }).eq("id", id);
                // Also remove sponsored badge? Requirement 6.89 says "remove badge"
                const { data: listing } = await supabase.from("listings").select("badges").eq("id", current.listing_id).single();
                if (listing) {
                    const badges = (listing.badges || []).filter((b: string) => b !== "sponsored");
                    await supabase.from("listings").update({ badges }).eq("id", current.listing_id);
                }
            } else {
                // at_expiry: handled by just letting it run out (or setting a renewal flag to false if we had one)
                await supabase.from("top_search_placements").update({ notes: current.notes + " (Not renewing)" }).eq("id", id);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Top Search update PUT error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAdmin(req);
        if ("error" in auth) return auth.error;
        const { id } = await params;
        const supabase = await createServerSupabaseClient();

        const { data: placement } = await supabase.from("top_search_placements").select("listing_id").eq("id", id).single();

        const { error } = await supabase.from("top_search_placements").delete().eq("id", id);
        if (error) throw error;

        // Cleanup badge
        if (placement) {
            const { data: listing } = await supabase.from("listings").select("badges").eq("id", placement.listing_id).single();
            if (listing) {
                const badges = (listing.badges || []).filter((b: string) => b !== "sponsored");
                await supabase.from("listings").update({ badges }).eq("id", placement.listing_id);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Top Search DELETE error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
