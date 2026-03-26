"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Clock, 
    MousePointer2, 
    MapPin, 
    Globe, 
    Smartphone, 
    Calendar,
    ArrowUpRight,
    Activity
} from "lucide-react";
import { format } from "date-fns";

export default function UserActivityLog({ activity }: { activity: any[] }) {
    if (activity.length === 0) {
        return (
            <Card className="border-gray-200">
                <CardHeader>
                    <CardTitle>Activity Log</CardTitle>
                    <CardDescription>Recent activity by this user across their listings.</CardDescription>
                </CardHeader>
                <CardContent className="h-48 flex flex-col items-center justify-center text-gray-500 italic space-y-2">
                    <Activity className="h-8 w-8 opacity-20" />
                    <p>No activity recorded yet.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-gray-200 overflow-hidden">
            <CardHeader className="bg-gray-50/50">
                <CardTitle className="text-xl flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Activity Log
                </CardTitle>
                <CardDescription>Historical data of user interactions and metrics.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                    {activity.map((log) => (
                        <div key={log.id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-start gap-4">
                            <div className="mt-1 p-2 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                                <MousePointer2 className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-gray-900 leading-none">
                                        Listing Impression / Interaction
                                    </p>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded tracking-tighter">
                                        ANALYTICS
                                    </span>
                                </div>
                                <div className="text-sm text-gray-500">
                                    Interaction detected for listing ID: <span className="text-blue-600 font-medium">{log.listing_id.substring(0, 8)}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                                    <div className="flex items-center text-xs text-gray-400">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {(() => {
                                            const date = new Date(log.created_at);
                                            return isNaN(date.getTime()) ? "—" : format(date, "MMM d, yyyy · HH:mm");
                                        })()}
                                    </div>
                                    <div className="flex items-center text-xs text-gray-400">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        Origin: Olongapo City
                                    </div>
                                </div>
                            </div>
                            <div className="hidden sm:flex flex-col items-end shrink-0">
                                <div className="flex items-center text-emerald-600 font-bold text-xs">
                                    <ArrowUpRight className="h-3 w-3 mr-1" />
                                    Active
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600">
                        View Full History Report
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
