import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth-helpers";
import { logSubscriptionAction, notifyOwner } from "@/lib/admin-helpers";

// GET Detail
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAdmin(req);
        if (auth.error) return auth.error;

        const { id } = await params;
        const supabase = createAdminSupabaseClient();

        // 1. Subscription
        const { data: subscription, error: subErr } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("id", id)
            .single();
        if (subErr || !subscription) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });

        // 2. Listing + Owner Info
        const { data: listing, error: listErr } = await supabase
            .from("listings")
            .select(`
                id, business_name, slug, category, status,
                profiles (
                    id, full_name, email, phone, created_at
                )
            `)
            .eq("id", subscription.listing_id)
            .single();
            
        // 3. Payments
        const { data: payments } = await supabase
            .from("payments")
            .select("*")
            .eq("subscription_id", id)
            .order("created_at", { ascending: false });

        // 4. History
        const { data: history } = await supabase
            .from("subscription_history")
            .select("*")
            .eq("subscription_id", id)
            .order("created_at", { ascending: false });

        return NextResponse.json({
            success: true,
            subscription,
            listing: {
                id: listing?.id,
                business_name: listing?.business_name,
                slug: listing?.slug,
                category: listing?.category,
                status: listing?.status
            },
            owner: listing?.profiles,
            payments: payments || [],
            history: history || []
        });

    } catch (error: any) {
        console.error("Admin subscription detail GET error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT Actions
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAdmin(req);
        if (auth.error) return auth.error;

        const { id } = await params;
        const body = await req.json();
        const { action } = body;
        const supabase = createAdminSupabaseClient();

        // Get current sub for context
        const { data: currentSub } = await supabase.from("subscriptions").select("listing_id, end_date, plan_type").eq("id", id).single();
        if (!currentSub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });

        let result: any = null;

        switch (action) {
            case "extend": {
                const { days, reason } = body;
                const newEndDate = new Date(currentSub.end_date || new Date());
                newEndDate.setDate(newEndDate.getDate() + (days || 30));
                
                const { error } = await supabase
                    .from("subscriptions")
                    .update({ 
                        end_date: newEndDate.toISOString(),
                        status: "active",
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", id);
                if (error) throw error;

                await logSubscriptionAction({ subscriptionId: id, action: "extended", details: { days, reason } });
                await notifyOwner({ 
                    ownerId: body.owner_id, 
                    title: "Subscription Extended", 
                    message: `Your ${currentSub.plan_type} subscription has been extended by ${days} days.` 
                });
                break;
            }

            case "upgrade": {
                const { new_plan } = body;
                const { error } = await supabase
                    .from("subscriptions")
                    .update({ 
                        plan_type: new_plan,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", id);
                if (error) throw error;

                // Sync with listing flags if immediate (assuming listed logic)
                await supabase.from("listings").update({ 
                    is_premium: new_plan === "premium",
                    is_featured: new_plan === "featured"
                }).eq("id", currentSub.listing_id);

                await logSubscriptionAction({ subscriptionId: id, action: "upgraded", details: { from: currentSub.plan_type, to: new_plan } });
                await notifyOwner({ 
                    ownerId: body.owner_id, 
                    title: "Plan Upgraded", 
                    message: `Your listing has been upgraded to ${new_plan}.` 
                });
                break;
            }

            case "cancel": {
                const { effective, reason } = body;
                if (effective === "immediate") {
                    await supabase.from("subscriptions").update({ 
                        status: "cancelled", 
                        auto_renew: false,
                        updated_at: new Date().toISOString()
                    }).eq("id", id);
                    
                    // Immediately remove listing benefits
                    await supabase.from("listings").update({ is_premium: false, is_featured: false }).eq("id", currentSub.listing_id);
                } else {
                    // end_of_cycle
                    await supabase.from("subscriptions").update({ 
                        auto_renew: false,
                        updated_at: new Date().toISOString()
                    }).eq("id", id);
                }

                await logSubscriptionAction({ subscriptionId: id, action: "cancelled", details: { effective, reason } });
                await notifyOwner({ 
                    ownerId: body.owner_id, 
                    title: "Subscription Cancelled", 
                    message: `Your subscription has been cancelled (${effective}).` 
                });
                break;
            }

            case "send_reminder": {
                // Logic for sending email would go here (Resend)
                await logSubscriptionAction({ subscriptionId: id, action: "reminder_sent" });
                break;
            }

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Admin subscription action PUT error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
