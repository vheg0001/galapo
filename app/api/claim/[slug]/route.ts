import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { getServerSession } from "@/lib/auth-helpers";

/**
 * POST /api/claim/[slug]
 * Submit a claim for a pre-populated listing
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = await createServerSupabaseClient();

        // Find the listing by slug
        const { data: listing, error: listingError } = await supabase
            .from("listings")
            .select("id, status, owner_id, business_name")
            .eq("slug", slug)
            .single();

        if (listingError || !listing) {
            return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        }

        if (listing.owner_id && listing.status !== "claimed_pending") {
            return NextResponse.json(
                { error: "This business has already been claimed" },
                { status: 409 }
            );
        }

        if (listing.status === "claimed_pending") {
            // Check if current user already has a pending claim
            const { data: existingClaim } = await supabase
                .from("listings")
                .select("owner_id")
                .eq("id", listing.id)
                .eq("owner_id", session.user.id)
                .single();

            if (existingClaim) {
                return NextResponse.json(
                    { error: "Your claim is already under review" },
                    { status: 409 }
                );
            }

            return NextResponse.json(
                { error: "This listing already has a pending claim. Please contact support." },
                { status: 409 }
            );
        }

        const formData = await req.formData();
        const proofFile = formData.get("proof_file") as File | null;
        const phone = formData.get("phone") as string;
        const notes = formData.get("notes") as string;

        let claimProofUrl: string | null = null;

        // Upload proof document if provided
        if (proofFile) {
            const ext = proofFile.name.split(".").pop();
            const fileName = `${listing.id}/${session.user.id}-${Date.now()}.${ext}`;

            const arrayBuffer = await proofFile.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const admin = createAdminSupabaseClient();
            const { error: uploadError } = await admin.storage
                .from("claims")
                .upload(fileName, buffer, {
                    upsert: false,
                    contentType: proofFile.type,
                });

            if (uploadError) {
                console.error("[CLAIM_POST] Upload Error:", uploadError);
                throw new Error("Failed to upload proof document.");
            }

            const { data: { publicUrl } } = admin.storage
                .from("claims")
                .getPublicUrl(fileName);

            claimProofUrl = publicUrl;
        }

        // Update listing to claimed_pending and assign owner
        const admin = createAdminSupabaseClient();
        const { error: updateError } = await admin
            .from("listings")
            .update({
                owner_id: session.user.id,
                status: "claimed_pending",
                claim_proof_url: claimProofUrl,
                claimed_at: new Date().toISOString(),
            })
            .eq("id", listing.id);

        if (updateError) throw updateError;

        // Notify admins via notification
        await admin.from("notifications").insert({
            user_id: session.user.id,
            type: "new_claim_request",
            title: `New Claim Request: ${listing.business_name}`,
            message: `${session.user.email} has submitted a claim for "${listing.business_name}". ${notes ? `Notes: ${notes}` : ""}`,
            data: {
                listing_id: listing.id,
                listing_name: listing.business_name,
                claim_proof_url: claimProofUrl,
                phone,
            },
        });

        return NextResponse.json({ success: true, listing_id: listing.id });
    } catch (error: any) {
        console.error("[CLAIM_POST]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
