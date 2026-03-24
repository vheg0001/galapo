import { NextRequest, NextResponse } from "next/server";
import { requireBusinessOwner } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";
import {
    getTopSearchPricingAndInstructions,
    validatePaymentProofFile,
} from "@/lib/subscription-route-helpers";
import { NotificationType } from "@/lib/types";

/**
 * POST /api/business/payments/proof
 * Create a payment record and upload proof in one step.
 */
export async function POST(request: NextRequest) {
    const auth = await requireBusinessOwner(request);
    if ('error' in auth) return auth.error;
    const { profile } = auth;

    const admin = createAdminSupabaseClient();

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const referenceNumber = formData.get("reference_number") as string;
        const paymentMethod = (formData.get("payment_method") as "gcash" | "bank_transfer") || "gcash";
        const targetId = formData.get("target_id") as string;
        const paymentType = formData.get("payment_type") as "subscription" | "top_search";

        if (!file || !targetId || !paymentType) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Validate Target and Get Details
        let amount = 0;
        let description = "";
        let listingId = "";
        let businessName = "";

        if (paymentType === "subscription") {
            const { data: sub, error: subError } = await admin
                .from("subscriptions")
                .select("*, listings(business_name, id)")
                .eq("id", targetId)
                .single();
            
            if (subError || !sub) throw new Error("Subscription not found");
            amount = Number(sub.amount);
            listingId = (sub.listings as any).id;
            businessName = (sub.listings as any).business_name;
            description = `Upgrade to ${String(sub.plan_type).toUpperCase()} plan for ${businessName}`;
        } else if (paymentType === "top_search") {
            const { data: placement, error: placeError } = await admin
                .from("top_search_placements")
                .select("*, listings(business_name, id), categories!top_search_placements_category_id_fkey(name)")
                .eq("id", targetId)
                .single();
            
            if (placeError || !placement) throw new Error("Placement not found");
            
            const { amount: topSearchAmount } = await getTopSearchPricingAndInstructions();
            amount = topSearchAmount;
            
            listingId = (placement.listings as any).id;
            businessName = (placement.listings as any).business_name;
            description = `Top Search Placement (Pos #${placement.position}) for ${businessName} in ${(placement.categories as any).name}`;
        }

        // 2. Validate file
        validatePaymentProofFile(file);

        // 3. Create Payment Record (Pending)
        const { data: payment, error: payError } = await admin
            .from("payments")
            .insert({
                subscription_id: paymentType === "subscription" ? targetId : null,
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

        // 4. If Top Search, link the payment back to the placement
        if (paymentType === "top_search") {
            await admin
                .from("top_search_placements")
                .update({ payment_id: payment.id })
                .eq("id", targetId);
        }

        // 5. Upload Proof to Storage
        const fileExt = file.name.split(".").pop();
        const filePath = `${profile.id}/${payment.id}_${Date.now()}.${fileExt}`;
        
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

        // 7. Create notifications
        const { data: admins } = await admin
            .from("profiles")
            .select("id")
            .eq("role", "super_admin")
            .eq("is_active", true);

        const notifications = [];

        // 1. Notify Super Admin(s)
        if (admins && admins.length > 0) {
            admins.forEach(a => {
                notifications.push({
                    user_id: a.id,
                    type: NotificationType.NEW_PAYMENT_UPLOADED,
                    title: "New Payment Proof Uploaded",
                    message: `${profile.full_name || profile.email} uploaded proof for ${description} for ${businessName}`,
                    data: { payment_id: payment.id, listing_id: listingId }
                });
            });
        }

        // 2. Notify Business Owner
        notifications.push({
            user_id: profile.id,
            type: NotificationType.NEW_PAYMENT_UPLOADED,
            title: "Payment proof submitted",
            message: `Your payment proof for ${businessName} has been received and is currently pending verification.`,
            data: { payment_id: payment.id, listing_id: listingId }
        });

        await admin.from("notifications").insert(notifications);

        return NextResponse.json({ 
            message: "Payment proof uploaded successfully",
            payment_id: payment.id 
        });

    } catch (error: any) {
        console.error("POST /api/business/payments/proof error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
