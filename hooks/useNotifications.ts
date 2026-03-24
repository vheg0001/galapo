"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { createBrowserSupabaseClient } from "@/lib/supabase";

/**
 * Hook to manage unread notification count with real-time updates.
 */
export function useNotifications() {
    const { user } = useAuthStore();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            return;
        }

        const supabase = createBrowserSupabaseClient();

        // 1. Initial fetch of unread count
        const fetchUnreadCount = async () => {
            try {
                const { count, error } = await supabase
                    .from("notifications")
                    .select("*", { count: "exact", head: true })
                    .eq("user_id", user.id)
                    .eq("is_read", false);

                if (!error) {
                    setUnreadCount(count || 0);
                }
            } catch (err) {
                console.error("Error fetching unread count:", err);
            }
        };

        fetchUnreadCount();

        // 2. Real-time subscription to notification changes for this user
        const channel = supabase
            .channel(`user-notifications-${user.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    // Re-fetch on any change (new notification, marked as read, or deleted)
                    fetchUnreadCount();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return { unreadCount };
}
