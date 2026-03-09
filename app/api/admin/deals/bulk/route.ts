import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { deal_ids, action } = await request.json();

        if (!deal_ids || !Array.isArray(deal_ids) || deal_ids.length === 0) {
            return NextResponse.json({ error: "Invalid deal IDs" }, { status: 400 });
        }

        if (action === "deactivate") {
            const { error } = await supabase
                .from("deals")
                .update({ is_active: false })
                .in("id", deal_ids);

            if (error) throw error;
        } else if (action === "delete") {
            const { error } = await supabase
                .from("deals")
                .delete()
                .in("id", deal_ids);

            if (error) throw error;
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[api/admin/deals/bulk POST]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
