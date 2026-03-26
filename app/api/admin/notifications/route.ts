import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/notifications
 * Fetch all notifications for admin review with robust pagination
 */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type") || "";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = 50;
        const offset = (page - 1) * limit;

        const admin = createAdminSupabaseClient();
        
        // 1. Get filtered count
        let countQuery = admin
            .from("notifications")
            .select("*", { count: "exact", head: true });
        
        if (type) countQuery = countQuery.eq("type", type);
        
        const { count, error: countError } = await countQuery;
        
        if (countError) {
             return NextResponse.json({ 
                error: "Count query failed", 
                message: countError.message,
                code: countError.code
            }, { status: 500 });
        }

        const total = count || 0;

        // 2. Fetch notifications only if offset is valid
        let notifications: any[] = [];
        if (total > 0 && offset < total) {
            let dataQuery = admin
                .from("notifications")
                .select(`
                    *,
                    profiles!user_id(id, full_name, email)
                `);

            if (type) dataQuery = dataQuery.eq("type", type);
            dataQuery = dataQuery.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

            const { data: fetchResults, error: fetchError } = await dataQuery;
            
            if (fetchError) {
                return NextResponse.json({ 
                    error: "Data fetch failed", 
                    message: fetchError.message,
                    code: fetchError.code
                }, { status: 500 });
            }
            notifications = fetchResults || [];
        }

        // 3. Get total global stats for dashboard cards
        const [totalRes, unreadRes, broadcastRes] = await Promise.all([
            admin.from("notifications").select("*", { count: "exact", head: true }),
            admin.from("notifications").select("*", { count: "exact", head: true }).eq("is_read", false),
            admin.from("notifications").select("*", { count: "exact", head: true }).eq("type", "broadcast")
        ]);

        return NextResponse.json({
            notifications: notifications.map(n => ({ ...n, user: n.profiles })),
            stats: {
                total_sent: totalRes.count || 0,
                unread_count: unreadRes.count || 0,
                broadcast_count: broadcastRes.count || 0
            },
            pagination: { total, page, limit }
        });

    } catch (err: any) {
        return NextResponse.json({ 
            error: "Global failure", 
            message: err.message || String(err) 
        }, { status: 500 });
    }
}

/**
 * POST /api/admin/notifications
 * Send a targeted or broadcast notification
 */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const body = await request.json();
        const { title, message, type, broadcast, user_id } = body;

        const admin = createAdminSupabaseClient();

        // Ensure type matches the database enum
        const validTypes = [
            'listing_approved', 'listing_rejected', 'claim_approved', 'claim_rejected',
            'subscription_expiring', 'premium_expiring', 'annual_check', 'annual_check_warning',
            'listing_deactivated', 'payment_confirmed', 'payment_rejected', 'new_listing_submitted',
            'new_claim_request', 'new_payment_uploaded', 'annual_check_flagged', 'annual_check_no_response',
            'broadcast', 'top_search_assigned', 'top_search_removed', 'top_search_expiring'
        ];

        let finalType = type;
        if (broadcast || type === "system" || !type || !validTypes.includes(type)) {
            finalType = "broadcast";
        }

        if (broadcast) {
            // Get all profiles to broadcast to
            const { data: profiles, error: profileError } = await admin
                .from("profiles")
                .select("id");

            if (profileError) throw profileError;

            if (!profiles || profiles.length === 0) {
                return NextResponse.json({ error: "No users found to broadcast to." }, { status: 404 });
            }

            // Insert notifications for all users
            const notifications = profiles.map(p => ({
                user_id: p.id,
                title,
                message,
                type: finalType,
                is_read: false
            }));

            const { error: insertError } = await admin
                .from("notifications")
                .insert(notifications);

            if (insertError) throw insertError;

            return NextResponse.json({ 
                success: true, 
                message: `Broadcast sent to ${profiles.length} users.` 
            });
        } else {
            if (!user_id) {
                return NextResponse.json({ error: "User ID is required for targeted notifications." }, { status: 400 });
            }

            const { error: insertError } = await admin
                .from("notifications")
                .insert({
                    user_id,
                    title,
                    message,
                    type: finalType,
                    is_read: false
                });

            if (insertError) throw insertError;

            return NextResponse.json({ 
                success: true, 
                message: "Notification sent successfully." 
            });
        }
    } catch (err: any) {
        return NextResponse.json({ 
            error: "Failed to send notification", 
            message: err.message || String(err) 
        }, { status: 500 });
    }
}
