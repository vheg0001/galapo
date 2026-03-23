import { NextResponse } from "next/server";
import { getPricingSettings } from "@/lib/subscription-helpers";

export const dynamic = "force-dynamic";

/**
 * GET /api/pricing
 * Fetch current pricing from site_settings (Public).
 */
export async function GET() {
    try {
        const pricing = await getPricingSettings();
        return NextResponse.json(pricing);
    } catch (error: any) {
        console.error("GET /api/pricing error:", error);
        return NextResponse.json({ 
            error: error.message,
            featured_monthly: 299, 
            premium_monthly: 599, 
            top_search_monthly: 999, 
            ad_placement_monthly: 1499 
        });
    }
}