import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAdmin(req);
        if (auth.error) return auth.error;

        const { id } = await params;
        const supabase = createAdminSupabaseClient();

        // Fetch subscription
        const { data: subscription, error: subError } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("id", id)
            .single();

        if (subError || !subscription) {
            return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
        }

        // Fetch related listing and owner
        const { data: listingData } = await supabase
            .from("listings")
            .select(`
                id,
                business_name,
                owner_id,
                profiles (
                    id,
                    full_name,
                    email
                )
            `)
            .eq("id", subscription.listing_id)
            .single();

        // Fetch related payments for this subscription
        const { data: payments } = await supabase
            .from("payments")
            .select("*")
            .eq("subscription_id", subscription.id)
            .order("created_at", { ascending: false });

        return NextResponse.json({
            success: true,
            subscription,
            listing: {
                id: listingData?.id,
                business_name: listingData?.business_name,
            },
            owner: listingData?.profiles,
            payments: payments || []
        });

    } catch (error: any) {
        console.error("Failed to fetch subscription details:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch subscription details" },
            { status: 500 }
        );
    }
}
