import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { verifyPaymentAndActivate, rejectPayment } from "@/lib/admin-verification-helpers";

/**
 * POST /api/admin/payments/bulk
 * Bulk verify or reject payments.
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await requireAdmin(request);
        if ('error' in auth) return auth.error;

        const { user } = auth;
        const { payment_ids, action, reason } = await request.json();

        if (!payment_ids || !Array.isArray(payment_ids) || payment_ids.length === 0) {
            return NextResponse.json({ error: "No payment IDs provided" }, { status: 400 });
        }

        if (action !== "verify" && action !== "reject") {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        if (action === "reject" && !reason) {
            return NextResponse.json({ error: "Rejection reason is required for bulk rejection" }, { status: 400 });
        }

        const stats = {
            success_count: 0,
            failed_count: 0,
            errors: [] as any[]
        };

        for (const id of payment_ids) {
            try {
                if (action === "verify") {
                    await verifyPaymentAndActivate(id, user.id);
                } else {
                    await rejectPayment(id, reason, user.id);
                }
                stats.success_count++;
            } catch (error: any) {
                console.error(`BULK_DEBUG: Bulk ${action} failed for payment ${id}:`, error);
                stats.failed_count++;
                stats.errors.push({ id, error: error.message });
            }
        }

        return NextResponse.json(stats);

    } catch (error: any) {
        console.error("POST /api/admin/payments/bulk error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
