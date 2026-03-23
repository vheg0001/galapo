import { NextRequest, NextResponse } from "next/server";
import { requireBusinessOwner } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { resolveEqMutation } from "@/lib/supabase-query-utils";
import { validatePaymentProofFile } from "@/lib/subscription-route-helpers";
import { NotificationType } from "@/lib/types";

/**
 * POST /api/business/payments/[id]/proof
 * Upload payment proof for a pending payment.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireBusinessOwner(request);
    if ('error' in auth) return auth.error;
    const { profile } = auth;

    const admin = createAdminSupabaseClient();

    try {
        const { id } = await params;
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const referenceNumber = formData.get("reference_number") as string;
        const paymentMethod = (formData.get("payment_method") as "gcash" | "bank_transfer") || undefined;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // 1. Verify payment ownership and status
        const { data: payment, error: payError } = await admin
            .from("payments")
            .select("*, listings(business_name)")
            .eq("id", id)
            .single();

        if (payError) throw payError;
        if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

        if (payment.user_id !== profile.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (payment.status !== "pending") {
            return NextResponse.json({ error: "Payment is no longer pending verification" }, { status: 400 });
        }

        // 2. Validate file
        validatePaymentProofFile(file);

        // 3. Upload to storage
        const fileExt = file.name.split(".").pop();
        const filePath = `${profile.id}/${id}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await admin.storage
            .from("payments")
            .upload(filePath, file, {
                contentType: file.type,
                cacheControl: "3600",
                upsert: true
            });

        if (uploadError) throw uploadError;

        // Get public URL (or private signed URL if bucket is private)
        // For simplicity, we'll store the path and use it to get signed URLs later if needed,
        // but here we just need to let the admin know it's there.
        const { data: { publicUrl } } = admin.storage
            .from("payments")
            .getPublicUrl(filePath);

        // 4. Update payment record
        const updateQuery = admin
            .from("payments")
            .update({
                payment_proof_url: publicUrl,
                reference_number: referenceNumber,
                payment_method: paymentMethod ?? payment.payment_method,
                status: "pending" // ensure it stays pending for admin review
            });
        const { error: updateError } = await resolveEqMutation(updateQuery, "id", id);

        if (updateError) throw updateError;

        // 5. Create notification for admin
        // Find super_admins
        const { data: admins } = await admin
            .from("profiles")
            .select("id")
            .eq("role", "super_admin");

        if (admins && admins.length > 0) {
            const notifications = admins.map(a => ({
                user_id: a.id,
                type: NotificationType.NEW_PAYMENT_UPLOADED,
                title: "New Payment Proof Uploaded",
                message: `${profile.full_name || profile.email} uploaded proof for ${payment.description || "a payment"} for ${payment.listings?.business_name}`,
                data: { payment_id: id, listing_id: payment.listing_id }
            }));

            await admin.from("notifications").insert(notifications);
        }

        return NextResponse.json({ message: "Payment proof uploaded successfully", payment_id: id });

    } catch (error: any) {
        console.error("POST /api/business/payments/[id]/proof error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
