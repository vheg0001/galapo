"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, Award, History, Loader2, AlertCircle } from "lucide-react";
import { Badge, ListingBadge } from "@/lib/types";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import BadgeAssignModal from "./BadgeAssignModal";
import BadgeHistory from "./BadgeHistory";
import { toast } from "react-hot-toast";

interface BadgeAssignmentProps {
    listingId: string;
}

export default function BadgeAssignment({ listingId }: BadgeAssignmentProps) {
    const [listingBadges, setListingBadges] = useState<ListingBadge[]>([]);
    const [loading, setLoading] = useState(true);
    const [assignOpen, setAssignOpen] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [isRemoving, setIsRemoving] = useState<string | null>(null);

    const loadBadges = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/listings/${listingId}/badges`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setListingBadges(data.data ?? []);
        } catch (error: any) {
            toast.error("Failed to load listing badges");
        } finally {
            setLoading(false);
        }
    }, [listingId]);

    useEffect(() => {
        loadBadges();
    }, [loadBadges]);

    const handleRemove = async (badgeId: string) => {
        if (!confirm("Are you sure you want to remove this badge?")) return;

        try {
            setIsRemoving(badgeId);
            const res = await fetch(`/api/admin/listings/${listingId}/badges?badge_id=${badgeId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to remove badge");

            toast.success("Badge removed");
            loadBadges();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsRemoving(null);
        }
    };

    const activeBadges = listingBadges.filter(lb => lb.is_active && lb.badge);
    const maxReached = activeBadges.length >= 5;

    const renderBadgeIcon = (badge: Badge) => {
        if (badge.icon_lucide) {
            const Icon = (LucideIcons as any)[badge.icon_lucide];
            if (Icon) return <Icon className="h-3.5 w-3.5" />;
        }
        return <span className="text-sm leading-none">{badge.icon}</span>;
    };

    return (
        <div className="rounded-[2rem] border border-border/50 bg-background/50 p-6 shadow-sm ring-1 ring-border/5">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Award className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Listing Badges</h3>
                </div>
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={cn(
                        "p-2 rounded-xl border border-border/50 transition-all hover:bg-secondary",
                        showHistory ? "bg-primary/5 text-primary border-primary/20" : "text-muted-foreground"
                    )}
                    title="View Badge History"
                >
                    <History className="h-4 w-4" />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-primary/30" />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Current Active Badges */}
                    <div className="space-y-2.5">
                        {activeBadges.length === 0 ? (
                            <div className="p-4 rounded-2xl border border-dashed border-border/60 text-center">
                                <p className="text-xs font-medium text-muted-foreground">No active badges assigned</p>
                            </div>
                        ) : (
                            activeBadges.map((lb) => (
                                <div key={lb.id} className="flex flex-col gap-2 p-3 rounded-2xl bg-background border border-border/40 shadow-sm animate-in fade-in slide-in-from-right-2">
                                    <div className="flex items-center justify-between">
                                        <div
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm"
                                            style={{ backgroundColor: lb.badge.color, color: lb.badge.text_color }}
                                        >
                                            {renderBadgeIcon(lb.badge)}
                                            {lb.badge.name}
                                        </div>
                                        <button
                                            onClick={() => handleRemove(lb.badge_id)}
                                            disabled={isRemoving === lb.badge_id}
                                            className="p-1 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
                                        >
                                            {isRemoving === lb.badge_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-1 px-1">
                                        <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
                                            <span>Assigned: {new Date(lb.assigned_at).toLocaleDateString()}</span>
                                            {lb.expires_at && (
                                                <span className={cn(
                                                    new Date(lb.expires_at) < new Date() ? "text-red-500" : "text-emerald-500"
                                                )}>
                                                    Expires: {new Date(lb.expires_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add Badge Toggle */}
                    <div className="pt-2">
                        {maxReached ? (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span className="text-[10px] font-bold uppercase">Maximum of 5 active badges reached</span>
                            </div>
                        ) : (
                            <button
                                onClick={() => setAssignOpen(true)}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/95 hover:scale-105 active:scale-95"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Assign Badge
                            </button>
                        )}
                    </div>

                    {/* Collapsible History */}
                    {showHistory && (
                        <div className="pt-4 border-t border-border/50 animate-in slide-in-from-top-4 duration-300">
                            <BadgeHistory history={listingBadges} />
                        </div>
                    )}
                </div>
            )}

            <BadgeAssignModal
                isOpen={assignOpen}
                onClose={() => setAssignOpen(false)}
                onAssigned={() => { loadBadges(); setAssignOpen(false); }}
                listingId={listingId}
                assignedBadgeIds={activeBadges.map(b => b.badge_id)}
            />
        </div>
    );
}
