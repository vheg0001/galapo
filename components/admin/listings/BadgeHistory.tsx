"use client";

import { ListingBadge } from "@/lib/types";
import { cn } from "@/lib/utils";
import { History, Calendar, CheckCircle2, XCircle } from "lucide-react";

interface BadgeHistoryProps {
    history: ListingBadge[];
}

export default function BadgeHistory({ history }: BadgeHistoryProps) {
    const sorted = [...history].sort((a, b) =>
        new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime()
    );

    if (sorted.length === 0) {
        return <p className="text-[10px] text-center text-muted-foreground/60 p-4">Empty History</p>;
    }

    return (
        <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Assignment Log</h4>
            <div className="space-y-3 max-h-60 overflow-auto pr-2 scrollbar-hide">
                {sorted.map((item) => (
                    <div key={item.id} className="relative pl-6 pb-2 border-l border-border/40 last:pb-0">
                        {/* Status Icon */}
                        <div className={cn(
                            "absolute -left-1.5 top-0 w-3 h-3 rounded-full border-2 border-background shadow-sm",
                            item.is_active ? "bg-emerald-500" : "bg-red-400"
                        )} />

                        <div className="space-y-1">
                            <div className="flex items-center justify-between font-bold text-[10px]">
                                <span className="text-foreground">{item.badge?.name || "Unknown Badge"}</span>
                                <span className="text-muted-foreground/60">{new Date(item.assigned_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground/80 leading-relaxed italic">
                                "{item.note || "No note"}"
                            </p>
                            {!item.is_active && (
                                <p className="text-[9px] font-bold text-red-500 uppercase tracking-tighter">
                                    {item.expires_at && new Date(item.expires_at) < new Date() ? "Expired" : "Removed"}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
