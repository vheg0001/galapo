import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const body = await request.json();
        const eventIds = Array.isArray(body.event_ids) ? body.event_ids : [];
        const action = String(body.action || "");

        if (eventIds.length === 0) {
            return NextResponse.json({ error: "Event IDs are required." }, { status: 400 });
        }

        if (action === "activate") {
            const { error } = await auth.adminClient.from("events").update({ is_active: true }).in("id", eventIds);
            if (error) throw error;
        } else if (action === "deactivate") {
            const { error } = await auth.adminClient.from("events").update({ is_active: false }).in("id", eventIds);
            if (error) throw error;
        } else if (action === "toggle_featured") {
            const { data, error } = await auth.adminClient.from("events").select("id, is_featured").in("id", eventIds);
            if (error) throw error;

            await Promise.all((data || []).map((event: any) =>
                auth.adminClient.from("events").update({ is_featured: !event.is_featured }).eq("id", event.id)
            ));
        } else if (action === "delete") {
            const { error } = await auth.adminClient.from("events").delete().in("id", eventIds);
            if (error) throw error;
        } else {
            return NextResponse.json({ error: "Invalid action." }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[api/admin/events/bulk POST]", error);
        return NextResponse.json({ error: error.message || "Failed to apply bulk action" }, { status: 500 });
    }
}