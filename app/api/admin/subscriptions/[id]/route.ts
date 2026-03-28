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

        // Get current sub and owner for context
        const { data: subInfo, error: fetchErr } = await supabase
            .from("subscriptions")
            .select(`
                plan_type,
                end_date,
                listing_id,
                listings (
                    id,
                    owner_id
                )
            `)
            .eq("id", id)
            .single();

        if (fetchErr || !subInfo) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
        
        // Robustly get owner_id (handle if listings is an object or array)
        const listingData = (subInfo as any).listings;
        const listing = Array.isArray(listingData) ? listingData[0] : listingData;
        const ownerId = listing?.owner_id;
        const listingId = listing?.id;
        
        let result: any = null;

        switch (action) {
            case "extend": {
                const { days, reason } = body;
                const newEndDate = new Date(subInfo.end_date || new Date());
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
                
                if (ownerId) {
                    await notifyOwner({ 
                        ownerId, 
                        title: "Subscription Extended", 
                        message: `Your ${subInfo.plan_type} subscription has been extended by ${days} days.${reason ? ' Reason: ' + reason : ''}`,
                        type: "payment_confirmed" // Use existing confirmed enum type
                    });
                }
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

                await supabase.from("listings").update({ 
                    is_premium: new_plan === "premium",
                    is_featured: new_plan === "featured"
                }).eq("id", subInfo.listing_id);

                await logSubscriptionAction({ subscriptionId: id, action: "upgraded", details: { from: subInfo.plan_type, to: new_plan } });
                
                if (ownerId) {
                    await notifyOwner({ 
                        ownerId, 
                        title: "Plan Upgraded", 
                        message: `Your listing has been upgraded to ${new_plan}.`,
                        type: "payment_confirmed"
                    });
                }
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
                    
                    await supabase.from("listings").update({ is_premium: false, is_featured: false }).eq("id", subInfo.listing_id);
                } else {
                    await supabase.from("subscriptions").update({ 
                        auto_renew: false,
                        updated_at: new Date().toISOString()
                    }).eq("id", id);
                }

                await logSubscriptionAction({ subscriptionId: id, action: "cancelled", details: { effective, reason } });
                
                if (ownerId) {
                    await notifyOwner({ 
                        ownerId, 
                        title: "Subscription Cancelled", 
                        message: `Your subscription has been cancelled (${effective}).`,
                        type: "listing_deactivated"
                    });
                }
                break;
            }

            case "send_reminder": {
                await logSubscriptionAction({ subscriptionId: id, action: "reminder_sent" });
                
                if (ownerId) {
                    await notifyOwner({
                        ownerId,
                        title: "Subscription Renewal Reminder",
                        message: `Your ${subInfo.plan_type} subscription is expiring soon. Please renew to keep your premium benefits.`,
                        type: "subscription_expiring"
                    });
                }
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
