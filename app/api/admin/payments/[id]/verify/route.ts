import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { verifyPaymentAndActivate } from "@/lib/admin-verification-helpers";

/**
 * POST /api/admin/payments/[id]/verify
 * Verifies a payment and activates associated services.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { user } = await requireAdmin(request);
        const { id } = await params;

        const result = await verifyPaymentAndActivate(id, user.id);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("POST /api/admin/payments/[id]/verify error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
