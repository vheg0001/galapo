import { NextRequest, NextResponse } from "next/server";
import { requireBusinessOwner } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { validatePaymentProofFile } from "@/lib/subscription-route-helpers";
import { NotificationType } from "@/lib/types";

/**
 * POST /api/business/reactivate
 * Submit payment proof for a reactivation fee.
 */
export async function POST(request: NextRequest) {
    const auth = await requireBusinessOwner(request);
    if ('error' in auth) return auth.error;
    const { profile } = auth;

    const admin = createAdminSupabaseClient();

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const referenceNumber = formData.get("referenceNumber") as string;
        const paymentMethod = (formData.get("paymentMethod") as "gcash" | "bank_transfer") || "gcash";
        const listingId = formData.get("listingId") as string;
        const amount = Number(formData.get("amount"));
        const reactivationFeeId = formData.get("reactivationFeeId") as string;

        if (!file || !listingId || !amount) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Fetch listing details for description
        const { data: listing, error: listingError } = await admin
            .from("listings")
            .select("business_name")
            .eq("id", listingId)
            .single();

        if (listingError || !listing) throw new Error("Listing not found");

        // 2. Validate file
        validatePaymentProofFile(file);

        // 3. Create Payment Record (Pending)
        const description = `Reactivation Fee for ${listing.business_name}`;
        const { data: payment, error: payError } = await admin
            .from("payments")
            .insert({
                listing_id: listingId,
                user_id: profile.id,
                amount,
                payment_method: paymentMethod,
                payment_proof_url: "",
                reference_number: referenceNumber || null,
                description,
                status: "pending",
            })
            .select("*")
            .single();

        if (payError) throw payError;

        // 4. Update Reactivation Fee record
        if (reactivationFeeId) {
            await admin
                .from("reactivation_fees")
                .update({ 
                    payment_id: payment.id,
                    status: "pending" 
                })
                .eq("id", reactivationFeeId);
        } else {
            // Find any pending fee if ID not provided
            const { data: existingFee } = await admin
                .from("reactivation_fees")
                .select("id")
                .eq("listing_id", listingId)
                .eq("status", "pending")
                .maybeSingle();
            
            if (existingFee) {
                await admin
                    .from("reactivation_fees")
                    .update({ 
                        payment_id: payment.id,
                        status: "pending"
                    })
                    .eq("id", existingFee.id);
            }
        }

        // 5. Upload Proof to Storage
        const fileExt = file.name.split(".").pop();
        const filePath = `${profile.id}/reactivation_${payment.id}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await admin.storage
            .from("payments")
            .upload(filePath, file, {
                contentType: file.type,
                cacheControl: "3600",
                upsert: true
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = admin.storage
            .from("payments")
            .getPublicUrl(filePath);

        // 6. Update Payment Record with URL
        await admin
            .from("payments")
            .update({ payment_proof_url: publicUrl })
            .eq("id", payment.id);

        // 7. Notify Admins
        const { data: admins } = await admin
            .from("profiles")
            .select("id")
            .eq("role", "super_admin")
            .eq("is_active", true);

        if (admins && admins.length > 0) {
            const notifications = admins.map(a => ({
                user_id: a.id,
                type: NotificationType.NEW_PAYMENT_UPLOADED,
                title: "New Reactivation Fee Payment",
                message: `${profile.full_name || profile.email} uploaded proof for ${description}`,
                data: { payment_id: payment.id, listing_id: listingId }
            }));

            await admin.from("notifications").insert(notifications);
        }

        return NextResponse.json({ 
            success: true,
            message: "Reactivation payment proof submitted successfully",
            payment_id: payment.id 
        });

    } catch (error: any) {
        console.error("POST /api/business/reactivate error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
