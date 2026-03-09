"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Search, Loader2, Calendar, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { Badge } from "@/lib/types";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { toast } from "react-hot-toast";

interface BadgeAssignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAssigned: () => void;
    listingId: string;
    assignedBadgeIds: string[];
}

export default function BadgeAssignModal({
    isOpen,
    onClose,
    onAssigned,
    listingId,
    assignedBadgeIds,
}: BadgeAssignModalProps) {
    const [allBadges, setAllBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
    const [note, setNote] = useState("");
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        // Reset state when modal opens
        setSelectedBadge(null);
        setNote("");
        setExpiresAt(null);
        setSearch("");

        async function fetchBadges() {
            setLoading(true);
            try {
                const res = await fetch("/api/admin/badges");
                const data = await res.json();
                setAllBadges((data.data ?? []).filter((b: Badge) => b.is_active));
            } catch (err) {
                toast.error("Failed to fetch available badges");
            } finally {
                setLoading(false);
            }
        }
        fetchBadges();
    }, [isOpen]);

    const filtered = allBadges.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleBadgeSelect = (badge: Badge) => {
        if (assignedBadgeIds.includes(badge.id)) return;
        setSelectedBadge(badge);

        // Pre-fill expiry if it exists
        if (badge.auto_expires && badge.default_expiry_days) {
            const date = new Date();
            date.setDate(date.getDate() + badge.default_expiry_days);
            setExpiresAt(date.toISOString().split('T')[0]);
        } else {
            setExpiresAt(null);
        }
    };

    const handleAssign = async () => {
        if (!selectedBadge) return;

        try {
            setIsSaving(true);
            const res = await fetch(`/api/admin/listings/${listingId}/badges`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    badge_id: selectedBadge.id,
                    note,
                    expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to assign badge");

            toast.success(`"${selectedBadge.name}" badge assigned 🏅`);
            onAssigned();
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const renderBadgeIcon = (badge: Badge) => {
        if (badge.icon_lucide) {
            const Icon = (LucideIcons as any)[badge.icon_lucide];
            if (Icon) return <Icon className="h-4 w-4" />;
        }
        return <span className="text-xl leading-none">{badge.icon}</span>;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-[2.5rem] bg-background border border-border shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-border/50 bg-background/50 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                            <Plus className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Assign Badge</h2>
                            <p className="text-xs font-medium text-muted-foreground">Select an available badge to award this listing.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 rounded-2xl bg-secondary/30 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all active:scale-95"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                {!selectedBadge ? (
                    <div className="flex-1 flex flex-col p-8 overflow-hidden">
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                            <input
                                type="text"
                                placeholder="Search badges..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-12 w-full pl-12 pr-4 rounded-2xl border border-border/50 bg-background/50 font-bold focus:border-primary/50 transition-all outline-none"
                            />
                        </div>

                        {loading ? (
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
                                <p className="mt-4 text-sm font-medium text-muted-foreground">Fetching badges...</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-auto grid grid-cols-2 gap-4 p-2 scrollbar-hide">
                                {filtered.map((badge) => {
                                    const isAssigned = assignedBadgeIds.includes(badge.id);
                                    return (
                                        <button
                                            key={badge.id}
                                            onClick={() => handleBadgeSelect(badge)}
                                            disabled={isAssigned}
                                            className={cn(
                                                "flex flex-col items-center gap-3 p-6 rounded-[2rem] border transition-all duration-300",
                                                isAssigned
                                                    ? "bg-secondary/20 border-border/50 opacity-60 cursor-not-allowed"
                                                    : "bg-background border-border/40 hover:border-primary hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.02] active:scale-95"
                                            )}
                                        >
                                            <div
                                                className="h-12 w-12 flex items-center justify-center rounded-2xl shadow-sm"
                                                style={{ backgroundColor: badge.color, color: badge.text_color }}
                                            >
                                                {renderBadgeIcon(badge)}
                                            </div>
                                            <div className="text-center">
                                                <span className="block text-sm font-black text-foreground">{badge.name}</span>
                                                <span className="block text-[10px] font-bold text-muted-foreground uppercase opacity-60">{isAssigned ? "Already Assigned" : badge.type}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {filtered.length === 0 && !loading && (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                                <AlertCircle className="h-10 w-10 opacity-20 mb-4" />
                                <p className="text-sm font-medium">No available badges found</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 p-8 overflow-auto animate-in slide-in-from-right-4 duration-300">
                        <div className="mx-auto max-w-sm space-y-8">
                            {/* Selected Badge Header */}
                            <div className="flex flex-col items-center text-center gap-4">
                                <div
                                    className="h-20 w-20 flex items-center justify-center rounded-[2rem] shadow-xl animate-in zoom-in-75 duration-300"
                                    style={{ backgroundColor: selectedBadge.color, color: selectedBadge.text_color }}
                                >
                                    <div className="scale-150">
                                        {renderBadgeIcon(selectedBadge)}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight">{selectedBadge.name}</h3>
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{selectedBadge.type} Badge</p>
                                </div>
                                <button
                                    onClick={() => setSelectedBadge(null)}
                                    className="text-xs font-bold text-primary underline underline-offset-4 hover:text-primary/80"
                                >
                                    Change Badge
                                </button>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 px-1">Assignment Note (Internal)</label>
                                    <textarea
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Why are you assigning this badge? (Optional)"
                                        rows={2}
                                        className="w-full p-4 rounded-2xl border border-border/50 bg-background font-medium text-sm focus:border-primary/50 transition-all outline-none resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 px-1">
                                        Expiry Date
                                        {selectedBadge.auto_expires && (
                                            <span className="flex items-center gap-1 text-[9px] text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded">
                                                <Calendar className="h-3 w-3" />
                                                Defaults to {selectedBadge.default_expiry_days}d
                                            </span>
                                        )}
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="date"
                                            value={expiresAt || ""}
                                            onChange={(e) => setExpiresAt(e.target.value)}
                                            className="h-12 flex-1 px-4 rounded-xl border border-border/50 bg-background font-bold text-sm focus:border-primary/50 transition-all outline-none"
                                        />
                                        <button
                                            onClick={() => setExpiresAt(null)}
                                            className={cn(
                                                "h-12 px-4 rounded-xl border text-[10px] font-black uppercase tracking-tight transition-all",
                                                !expiresAt
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-secondary/40 border-border/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                            )}
                                        >
                                            Permanent
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground/60 px-1">Leave empty or click 'Permanent' if this badge should not auto-expire.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-border/50 bg-background/50 backdrop-blur-xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-secondary/50 transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedBadge || isSaving}
                        className="flex items-center gap-2 px-10 py-2.5 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/95 hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:pointer-events-none"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign Badge"}
                    </button>
                </div>
            </div>
        </div>
    );
}
