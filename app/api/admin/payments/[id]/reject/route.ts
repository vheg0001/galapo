import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { rejectPayment } from "@/lib/admin-verification-helpers";

/**
 * POST /api/admin/payments/[id]/reject
 * Rejects a payment and notifies the owner.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireAdmin(request);
        if ("error" in auth) return auth.error;
        const { user } = auth;
        const { id } = await params;
        const { reason } = await request.json();

        if (!reason) {
            return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
        }

        const result = await rejectPayment(id, reason, user.id);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("POST /api/admin/payments/[id]/reject error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
