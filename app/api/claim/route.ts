import { NextRequest, NextResponse } from "next/server";
import {
    createServerSupabaseClient,
    createAdminSupabaseClient
} from "@/lib/supabase";
import { getServerSession } from "@/lib/auth-helpers";

/**
 * POST /api/claim
 * Submit a claim request for a pre-populated business
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = await createServerSupabaseClient();
        const formData = await req.formData();

        const listingId = formData.get("listing_id") as string;
        const proofFile = formData.get("proof") as File;

        if (!listingId || !proofFile) {
            return NextResponse.json({ error: "Missing listing_id or proof document" }, { status: 400 });
        }

        // 1. Check if listing is claimable
        const { data: listing, error: fetchError } = await supabase
            .from("listings")
            .select("id, business_name, owner_id, status")
            .eq("id", listingId)
            .single();

        if (fetchError || !listing) {
            return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        }

        if (listing.owner_id) {
            return NextResponse.json({ error: "Listing is already claimed or managed" }, { status: 400 });
        }

        // 2. Upload proof document to "claims" bucket
        const fileExt = proofFile.name.split(".").pop();
        const fileName = `${listingId}/${session.user.id}_proof.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from("claims")
            .upload(fileName, proofFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from("claims")
            .getPublicUrl(fileName);

        // 3. Update listing status and owner_id
        const { error: updateError } = await supabase
            .from("listings")
            .update({
                owner_id: session.user.id,
                status: "claimed_pending",
                claim_proof_url: publicUrl,
                updated_at: new Date().toISOString()
            })
            .eq("id", listingId);

        if (updateError) throw updateError;

        // 4. Notify super admin using admin client to bypass RLS
        const adminClient = createAdminSupabaseClient();
        const { data: admin } = await adminClient
            .from("profiles")
            .select("id")
            .eq("role", "super_admin")
            .limit(1)
            .single();

        if (admin) {
            await adminClient.from("notifications").insert({
                user_id: admin.id,
                type: "new_claim_request",
                title: "New Claim Request",
                message: `User submitted a claim for listing: ${listing.business_name}`,
                data: { listing_id: listingId }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[CLAIM_POST]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
