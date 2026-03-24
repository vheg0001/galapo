import { NextRequest, NextResponse } from "next/server";
import { requireBusinessOwner } from "@/lib/auth-helpers";
import { getPaymentInstructions } from "@/lib/subscription-helpers";

/**
 * GET /api/business/payment-instructions
 * Fetch payment instructions (GCash/Bank) for business owners.
 * This is used by the reactivation flow and other payment-related components.
 */
export async function GET(request: NextRequest) {
    const auth = await requireBusinessOwner(request);
    if ('error' in auth) return auth.error;

    try {
        // We use a default amount of 0 since the client-side component (ReactivationFlow)
        // will overwrite it with the specific fee amount if needed.
        const instructions = await getPaymentInstructions(0);

        return NextResponse.json({
            success: true,
            data: instructions
        });
    } catch (error: any) {
        console.error("GET /api/business/payment-instructions error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch payment instructions" },
            { status: 500 }
        );
    }
}
