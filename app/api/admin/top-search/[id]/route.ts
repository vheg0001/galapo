import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAdmin(req);
        if ("error" in auth) return auth.error;
        const { id } = await params;
        const supabase = createAdminSupabaseClient();

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
        const supabase = createAdminSupabaseClient();

        const { data: current, error: fetchErr } = await supabase
            .from("top_search_placements")
            .select("*, listings(id, owner_id, business_name)")
            .eq("id", id)
            .single();

        if (fetchErr) throw fetchErr;
        if (!current) throw new Error("Placement not found");
        
        // Handle both object and array formats (Supabase joins)
        const listingInfo = Array.isArray(current.listings) ? current.listings[0] : current.listings;

        if (action === "extend") {
            const newEndDate = new Date(current.end_date);
            newEndDate.setDate(newEndDate.getDate() + (days || 7));
            
            const { error: updErr } = await supabase
                .from("top_search_placements")
                .update({ end_date: newEndDate.toISOString() })
                .eq("id", id);
            
            if (updErr) throw updErr;
        } else if (action === "remove") {
            if (!listingInfo) throw new Error("Listing data not found for this placement");

            if (effective === "immediate") {
                const { error: placErr } = await supabase.from("top_search_placements").update({ is_active: false, notes: reason ? (current.notes || "") + ` | Removed: ${reason}` : current.notes }).eq("id", id);
                if (placErr) throw placErr;
                
                // Deactivate sponsored badge in listing_badges
                await supabase
                    .from("listing_badges")
                    .update({ is_active: false })
                    .eq("listing_id", current.listing_id)
                    .eq("badge_id", "sponsored");

                // Send Notification
                if (listingInfo.owner_id) {
                    const { error: notifErr } = await supabase.from("notifications").insert({
                        user_id: listingInfo.owner_id,
                        type: "top_search_removed",
                        title: "Top Search Placement Removed",
                        message: `Your Top Search placement for ${listingInfo.business_name || "your listing"} has been removed. Reason: ${reason || "Manual cleanup by administrator"}.`,
                        data: { placement_id: id, reason },
                        is_read: false,
                        created_at: new Date().toISOString()
                    });
                    if (notifErr) throw notifErr;
                }
            } else {
                const { error: notesErr } = await supabase.from("top_search_placements").update({ notes: (current.notes || "") + " (Not renewing)" }).eq("id", id);
                if (notesErr) throw notesErr;
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
        const supabase = createAdminSupabaseClient();

        const { data: placement, error: fetchErr } = await supabase
            .from("top_search_placements")
            .select("id, listing_id, listings(id, owner_id, business_name)")
            .eq("id", id)
            .single();

        if (fetchErr) throw fetchErr;
        if (!placement) throw new Error("Placement not found");
        
        // Handle both object and array formats (Supabase joins)
        const listingInfo = Array.isArray((placement as any).listings) 
            ? (placement as any).listings[0] 
            : (placement as any).listings;

        const { error: delErr } = await supabase.from("top_search_placements").delete().eq("id", id);
        if (delErr) throw delErr;

        // Cleanup badge in listing_badges
        if (placement?.listing_id) {
            await supabase
                .from("listing_badges")
                .update({ is_active: false })
                .eq("listing_id", placement.listing_id)
                .eq("badge_id", "sponsored");
        }

        // Notify
        if (listingInfo) {
            const { error: notifErr } = await supabase.from("notifications").insert({
                user_id: listingInfo.owner_id,
                type: "top_search_removed",
                title: "Top Search Placement Removed",
                message: `Your Top Search placement for ${listingInfo.business_name || "your listing"} has been removed by an administrator.`,
                data: { placement_id: id },
                is_read: false,
                created_at: new Date().toISOString()
            });
            if (notifErr) throw notifErr;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Top Search DELETE error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
