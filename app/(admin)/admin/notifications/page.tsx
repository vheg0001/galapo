"use client";

import { Suspense } from "react";
import AdminNotificationsList from "@/components/admin/notifications/AdminNotificationsList";
import { Loader2, BellRing, Info } from "lucide-react";
import { 
    Tooltip, 
    TooltipContent, 
    TooltipProvider, 
    TooltipTrigger 
} from "@/components/ui/tooltip";

export default function AdminNotificationsPage() {
    return (
        <div className="flex-1 space-y-8 p-8 pt-6 max-w-[1400px] mx-auto">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-gray-900">
                        <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                            <BellRing className="h-6 w-6 text-white" />
                        </div>
                        System Notifications
                    </h2>
                    <p className="text-gray-500 flex items-center gap-2">
                        Broadcast announcements and managed user notifications.
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="h-4 w-4 text-gray-400" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    Admins can send targeted notifications to specific business owners or broadcast messages to all registered owners.
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </p>
                </div>
            </div>

            <Suspense fallback={
                <div className="h-[400px] flex items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                        <p className="text-sm font-medium text-gray-400">Loading notification center...</p>
                    </div>
                </div>
            }>
                <AdminNotificationsList />
            </Suspense>
        </div>
    );
}
