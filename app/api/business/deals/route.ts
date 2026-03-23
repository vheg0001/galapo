import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { canCreateDeal, getDealLimit, getActiveDealCount } from "@/lib/deal-helpers";
import { PlanType } from "@/lib/types";
import { getServerProfile, getServerUser } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const user = await getServerUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const listingId = searchParams.get("listing_id");

    const today = new Date().toISOString();

    try {
        let listingsQuery = supabase
            .from("listings")
            .select("id, business_name, is_premium, is_featured")
            .eq("owner_id", user.id);

        if (listingId) listingsQuery = listingsQuery.eq("id", listingId);

        const { data: listings, error: listingsError } = await listingsQuery;
        if (listingsError) throw listingsError;

        if (!listings || listings.length === 0) {
            return NextResponse.json({ data: [], limits: [] });
        }

        const listingIds = listings.map(l => l.id);

        // 2. Get deals for these listings
        let dealsQuery = supabase
            .from("deals")
            .select("*")
            .in("listing_id", listingIds);

        if (status === "active") {
            dealsQuery = dealsQuery.eq("is_active", true).gte("end_date", today);
        } else if (status === "expired") {
            dealsQuery = dealsQuery.lt("end_date", today);
        }

        const { data: deals, error: dealsError } = await dealsQuery.order("created_at", { ascending: false });
        if (dealsError) throw dealsError;

        // 3. Calculate limits for each listing
        const limits = await Promise.all(listings.map(async (l) => {
            let plan = PlanType.FREE;
            if (l.is_premium) plan = PlanType.PREMIUM;
            else if (l.is_featured) plan = PlanType.FEATURED;

            const max = getDealLimit(plan);
            const used = await getActiveDealCount(supabase, l.id);

            return {
                listing_id: l.id,
                business_name: l.business_name,
                plan,
                max,
                used,
                remaining: Math.max(0, max - used)
            };
        }));

        return NextResponse.json({
            data: deals || [],
            limits
        });
    } catch (error: any) {
        console.error("[api/business/deals GET]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const user = await getServerUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    try {
        const body = await request.json();
        const {
            listing_id,
            title,
            discount_text,
            description,
            image_url,
            start_date,
            end_date,
            terms_conditions,
            is_active
        } = body;

        // 1. Validation
        if (!listing_id || !title || !discount_text || !description || !start_date || !end_date) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (title.length > 100) return NextResponse.json({ error: "Title too long (max 100)" }, { status: 400 });
        if (discount_text.length > 30) return NextResponse.json({ error: "Discount text too long (max 30)" }, { status: 400 });

        const start = new Date(start_date);
        const end = new Date(end_date);
        const now = new Date();

        if (end <= now) return NextResponse.json({ error: "End date must be in the future" }, { status: 400 });
        if (end <= start) return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });

        // 2. Check Ownership & Limits
        const profile = await getServerProfile();
        const check = await canCreateDeal(supabase, listing_id, user.id, profile?.role);
        if (!check.allowed) {
            return NextResponse.json({ error: check.reason }, { status: 403 });
        }

        // 3. Create Deal
        const { data, error } = await supabase
            .from("deals")
            .insert({
                listing_id,
                title,
                description,
                image_url,
                discount_text,
                start_date: start.toISOString(),
                end_date: end.toISOString(),
                terms_conditions,
                is_active: is_active ?? true
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error("[api/business/deals POST]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
