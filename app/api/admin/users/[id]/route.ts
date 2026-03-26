import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// ─── GET /api/admin/users/[id] ────────────────────────────────────────────────
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const admin = createAdminSupabaseClient();
        const [{ data: profile }, { data: listings }, { data: admin_user_notes }] = await Promise.all([
            admin.from("profiles").select("*").eq("id", id).single(),
            admin.from("listings").select("id, business_name, slug, status, created_at, is_active, is_premium, is_featured")
                .eq("owner_id", id).order("created_at", { ascending: false }),
            admin.from("admin_user_notes").select("id, note, created_at, admin_id, profiles!admin_user_notes_admin_id_fkey(full_name)")
                 .eq("user_id", id).order("created_at", { ascending: false })
        ]);

        if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const listingIds = (listings ?? []).map((listing: any) => listing.id).filter(Boolean);

        // Main queries (subscriptions, payments, analytics)
        const [
            { data: subscriptions },
            { data: payments },
            { data: activityLog }
        ] = await Promise.all([
            listingIds.length
                ? admin.from("subscriptions")
                    .select("id, listing_id, plan_type, status, start_date, end_date, amount, created_at, listings(business_name)")
                    .in("listing_id", listingIds)
                    .order("created_at", { ascending: false })
                : Promise.resolve({ data: [] }),
            admin
                .from("payments")
                .select("id, listing_id, amount, status, payment_method, reference_number, created_at, description, listings(business_name)")
                .eq("user_id", id)
                .order("created_at", { ascending: false }),
            listingIds.length
                ? admin
                    .from("listing_analytics")
                    .select("id, listing_id, event_type, url, created_at")
                    .in("listing_id", listingIds)
                    .order("created_at", { ascending: false })
                    .limit(20)
                : Promise.resolve({ data: [] })
        ]);

        // ── Placement queries run separately so errors surface clearly ──────────
        let topSearchPlacements: any[] = [];
        let adPlacements: any[] = [];

        if (listingIds.length) {
            // Top Search: filter by listing_id (no joins — enrich separately)
            const { data: tspData, error: tspErr } = await admin
                .from("top_search_placements")
                .select("id, listing_id, category_id, position, is_active, start_date, end_date, payment_id, created_at")
                .in("listing_id", listingIds)
                .order("created_at", { ascending: false });
            if (tspErr) {
                console.error("[top_search_placements error]", tspErr);
            } else {
                // Enrich category names
                const catIds = [...new Set((tspData || []).map((p: any) => p.category_id).filter(Boolean))] as string[];
                let categoriesMap: Record<string, string> = {};
                if (catIds.length) {
                    const { data: catData } = await admin.from("categories").select("id, name").in("id", catIds);
                    categoriesMap = Object.fromEntries((catData || []).map((c: any) => [c.id, c.name]));
                }
                // Build a listings name map from the already-fetched listings
                const listingsNameMap: Record<string, string> = Object.fromEntries(
                    (listings || []).map((l: any) => [l.id, l.business_name])
                );
                topSearchPlacements = (tspData || []).map((p: any) => ({
                    id: p.id,
                    listing_id: p.listing_id,
                    category_id: p.category_id,
                    position: p.position,
                    is_active: p.is_active,
                    start_date: p.start_date,
                    end_date: p.end_date,
                    payment_id: p.payment_id,
                    created_at: p.created_at,
                    business_name: listingsNameMap[p.listing_id] || null,
                    category_name: categoriesMap[p.category_id] || null
                }));
            }

            // Banner Ads: filter by listing_id
            const { data: adData, error: adErr } = await admin
                .from("ad_placements")
                .select("id, listing_id, advertiser_id, title, placement_location, start_date, end_date, impressions, clicks, is_active, created_at")
                .in("listing_id", listingIds)
                .order("created_at", { ascending: false });
            if (adErr) console.error("[ad_placements error]", adErr);
            else adPlacements = adData || [];
        }

        // Also pick up any banner ads linked by advertiser_id
        {
            const { data: adByOwner } = await admin
                .from("ad_placements")
                .select("id, listing_id, advertiser_id, title, placement_location, start_date, end_date, impressions, clicks, is_active, created_at")
                .eq("advertiser_id", id)
                .order("created_at", { ascending: false });
            if (adByOwner?.length) {
                const existingIds = new Set(adPlacements.map((a: any) => a.id));
                adPlacements = [...adPlacements, ...adByOwner.filter((a: any) => !existingIds.has(a.id))];
            }
        }

        // ── Transforms ──────────────────────────────────────────────────────────
        const tListings = (listings || []).map((l: any) => ({
             ...l,
             plan: l.is_premium ? "premium" : (l.is_featured ? "featured" : "free"),
             views_this_month: 0
        }));

        const tSubscriptions = (subscriptions || []).map((s: any) => ({
            id: s.id,
            listing_name: s.listings?.business_name,
            plan: s.plan_type,
            plan_type: s.plan_type,
            status: s.status,
            amount: s.amount,
            start_date: s.start_date,
            end_date: s.end_date,
            created_at: s.created_at
        }));

        let total_spent = 0;
        let total_payments_verified = 0;
        const tPayments = (payments || []).map((p: any) => {
            if (p.status === "verified") {
                total_payments_verified++;
                total_spent += Number(p.amount) || 0;
            }
            return {
                id: p.id,
                amount: p.amount,
                status: p.status,
                date: p.created_at,
                description: p.description || `Payment via ${p.payment_method}`
            };
        });

        const active_listings = tListings.filter((l: any) => l.is_active).length;

        const tNotes = (admin_user_notes || []).map((n: any) => ({
            id: n.id,
            note: n.note,
            admin_name: (n.profiles as any)?.full_name || "Admin",
            date: n.created_at
        }));

        const tActivity = (activityLog || []).map((a: any) => ({
            id: a.id,
            listing_id: a.listing_id,
            type: a.event_type,
            description: "Listing interaction",
            created_at: a.created_at
        }));

        const last_activity = tActivity.length > 0 ? tActivity[0].created_at : (profile as any).updated_at;

        return NextResponse.json({
            profile: { ...profile, last_activity },
            listings: tListings,
            subscriptions: tSubscriptions,
            payments: tPayments,
            activity: tActivity,
            activity_log: tActivity,
            top_search: topSearchPlacements,
            banners: adPlacements.map((p: any) => ({
                id: p.id,
                listing_id: p.listing_id,
                advertiser_id: p.advertiser_id,
                business_name: p.business_name || null,
                title: p.title,
                placement_location: p.placement_location,
                start_date: p.start_date,
                end_date: p.end_date,
                impressions: p.impressions,
                clicks: p.clicks,
                is_active: p.is_active,
                created_at: p.created_at
            })),
            admin_notes: tNotes,
            stats: {
                total_listings: tListings.length,
                active_listings,
                total_payments_verified,
                total_spent
            }
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// ─── PUT /api/admin/users/[id] ────────────────────────────────────────────────
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    // Prevent self-deactivation/modification
    if (id === auth.user.id) {
        return NextResponse.json({ error: "Cannot modify your own admin account." }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;
    const admin = createAdminSupabaseClient();

    try {
        if (action === "toggle_active") {
            const { is_active } = body;
            const { data, error } = await admin
                .from("profiles")
                .update({ is_active, updated_at: new Date().toISOString() })
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return NextResponse.json({ success: true, profile: data });
        }
        
        if (action === "reset_password") {
            const { data: profile } = await admin.from("profiles").select("email").eq("id", id).single();
            if (!profile?.email) return NextResponse.json({ error: "User has no email" }, { status: 400 });

            const { error: resetError } = await admin.auth.resetPasswordForEmail(profile.email);
            if (resetError) throw resetError;
            return NextResponse.json({ success: true, message: "Password reset email sent" });
        }
        
        if (action === "delete") {
            const { listing_action } = body; // "keep" | "delete" | "transfer"
            
            if (listing_action === "delete") {
                await admin.from("listings").delete().eq("owner_id", id);
            } else if (listing_action === "keep") {
                await admin.from("listings").update({ owner_id: null }).eq("owner_id", id);
            } else if (listing_action === "transfer") {
                // By default, transfer to current admin
                await admin.from("listings").update({ owner_id: auth.user.id }).eq("owner_id", id);
            }

            // Finally, delete profile and auth user (Auth user deletion requires admin role API, deleting profile CASCADE does not delete auth user by default unless trigger is setup, but deleting auth user cascades to profile)
            const { error: deleteError } = await admin.auth.admin.deleteUser(id);
            if (deleteError) {
                // fallback to profile deletion if auth API fails
                await admin.from("profiles").delete().eq("id", id);
            }

            return NextResponse.json({ success: true, message: "User deleted" });
        }

        // Fallback for generic updates
        const updates: Record<string, any> = {};
        if (typeof body.is_active === "boolean") updates.is_active = body.is_active;
        if (["business_owner", "super_admin"].includes(body.role)) updates.role = body.role;

        if (Object.keys(updates).length > 0) {
            const { data, error } = await admin.from("profiles").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id).select().single();
            if (error) throw error;
            return NextResponse.json({ profile: data });
        }

        return NextResponse.json({ error: "Unknown action or no fields to update" }, { status: 400 });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
