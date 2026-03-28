import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { requireAdmin as authRequireAdmin, requireBusinessOwner as authRequireBusinessOwner } from "@/lib/auth-helpers";
import { NextResponse } from "next/server";
import { User } from "@supabase/supabase-js";
import { Profile } from "@/store/authStore";

export type AuthSuccess = {
    user: User;
    profile: Profile;
    userId: string;
    adminClient: ReturnType<typeof createAdminSupabaseClient>;
};

export type AuthResult = { error: NextResponse } | AuthSuccess;

/**
 * Re-exports from auth-helpers with compatibility for userId and adminClient properties.
 */
export async function requireAdmin(request: any): Promise<AuthResult> {
    const auth = await authRequireAdmin(request);
    if ("error" in auth) return auth as { error: NextResponse };
    
    return { 
        ...auth, 
        userId: auth.user.id,
        adminClient: createAdminSupabaseClient()
    };
}

export async function requireBusinessOwner(request: any): Promise<AuthResult> {
    const auth = await authRequireBusinessOwner(request);
    if ("error" in auth) return auth as { error: NextResponse };
    
    return { 
        ...auth, 
        userId: auth.user.id,
        adminClient: createAdminSupabaseClient()
    };
}

/**
 * Logs an action to subscription_history table.
 */
export async function logSubscriptionAction({
    subscriptionId,
    action,
    details = {},
    performedBy = null
}: {
    subscriptionId: string;
    action: string;
    details?: any;
    performedBy?: string | null;
}) {
    const supabase = createAdminSupabaseClient();
    
    const { error } = await supabase
        .from("subscription_history")
        .insert({
            subscription_id: subscriptionId,
            action,
            details,
            performed_by: performedBy,
            created_at: new Date().toISOString()
        });
        
    if (error) {
        console.error(`Failed to log subscription action [${action}]:`, error);
    }
}

/**
 * Creates a notification for a business owner.
 */
export async function notifyOwner({
    ownerId,
    title,
    message,
    type = "system",
    link = null
}: {
    ownerId: string;
    title: string;
    message: string;
    type?: string;
    link?: string | null;
}) {
    const supabase = createAdminSupabaseClient();
    
    const { error } = await supabase
        .from("notifications")
        .insert({
            user_id: ownerId,
            title,
            message,
            type,
            data: link ? { link } : {},
            is_read: false,
            created_at: new Date().toISOString()
        });
        
    if (error) {
        console.error(`Failed to notify owner [${ownerId}]:`, error);
    }
}

/**
 * Gets overview stats for the admin dashboard.
 */
export async function getAdminDashboardStats() {
    const admin = createAdminSupabaseClient();
    const [
        { count: pendingListings },
        { count: totalUsers },
        { count: activeListings },
        { count: totalInvoices }
    ] = await Promise.all([
        admin.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending"),
        admin.from("profiles").select("*", { count: "exact", head: true }),
        admin.from("listings").select("*", { count: "exact", head: true }).eq("status", "approved").eq("is_active", true),
        admin.from("invoices").select("*", { count: "exact", head: true })
    ]);

    return {
        pendingListings: pendingListings || 0,
        totalUsers: totalUsers || 0,
        activeListings: activeListings || 0,
        totalInvoices: totalInvoices || 0
    };
}

/**
 * Formats notification records for the admin activity feed.
 */
export function formatAdminActivity(notifications: any[]) {
    return notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        created_at: n.created_at,
        data: n.data
    }));
}
