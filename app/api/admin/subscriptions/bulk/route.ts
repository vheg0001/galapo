import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth-helpers";
import { logSubscriptionAction, notifyOwner } from "@/lib/admin-helpers";

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAdmin(req);
        if (auth.error) return auth.error;

        const { subscription_ids, action, params } = await req.json();
        const supabase = createAdminSupabaseClient();

        if (!subscription_ids || !Array.isArray(subscription_ids) || subscription_ids.length === 0) {
            return NextResponse.json({ error: "No subscriptions selected" }, { status: 400 });
        }

        const success_ids: string[] = [];
        const failed_ids: { id: string, error: string }[] = [];

        // Process each subscription
        for (const id of subscription_ids) {
            try {
                // Get sub for context
                const { data: sub } = await supabase.from("subscriptions").select("listing_id, end_date, plan_type").eq("id", id).single();
                if (!sub) throw new Error("Sub not found");

                const { data: listing } = await supabase.from("listings").select("owner_id").eq("id", sub.listing_id).single();

                switch (action) {
                    case "extend": {
                        const days = params?.days || 30;
                        const newEndDate = new Date(sub.end_date || new Date());
                        newEndDate.setDate(newEndDate.getDate() + days);
                        
                        const { error } = await supabase.from("subscriptions")
                            .update({ end_date: newEndDate.toISOString(), status: "active", updated_at: new Date().toISOString() })
                            .eq("id", id);
                        if (error) throw error;

                        await logSubscriptionAction({ subscriptionId: id, action: "extended", details: { days, is_bulk: true } });
                        if (listing?.owner_id) {
                            await notifyOwner({ ownerId: listing.owner_id, title: "Subscription Extended (Bulk)", message: `Admin extended your ${sub.plan_type} subscription.` });
                        }
                        break;
                    }

                    case "cancel": {
                        await supabase.from("subscriptions")
                            .update({ status: "cancelled", auto_renew: false, updated_at: new Date().toISOString() })
                            .eq("id", id);
                        await supabase.from("listings").update({ is_premium: false, is_featured: false }).eq("id", sub.listing_id);
                        
                        await logSubscriptionAction({ subscriptionId: id, action: "cancelled", details: { is_bulk: true } });
                        break;
                    }

                    case "send_reminder": {
                        await logSubscriptionAction({ subscriptionId: id, action: "reminder_sent", details: { is_bulk: true } });
                        break;
                    }

                    default:
                        throw new Error(`Invalid action: ${action}`);
                }
                success_ids.push(id);
            } catch (err: any) {
                failed_ids.push({ id, error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            success_count: success_ids.length,
            failed_count: failed_ids.length,
            errors: failed_ids
        });

    } catch (error: any) {
        console.error("Admin subscriptions bulk POST error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
