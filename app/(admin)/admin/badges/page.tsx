"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";
import BadgeTable from "@/components/admin/badges/BadgeTable";
import BadgeEditorModal from "@/components/admin/badges/BadgeEditorModal";
import ConfirmDialog from "@/components/admin/shared/ConfirmDialog";
import { Badge } from "@/lib/types";
import { toast } from "react-hot-toast";

type BadgeWithCount = Badge & { assigned_count: number };

export default function AdminBadgesPage() {
    const [badges, setBadges] = useState<BadgeWithCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [editorOpen, setEditorOpen] = useState(false);
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Badge | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadBadges = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/badges");
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setBadges(data.data ?? []);
        } catch (error: any) {
            toast.error("Failed to load badges: " + error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBadges();
    }, [loadBadges]);

    const handleAddBadge = () => {
        setSelectedBadge(null);
        setEditorOpen(true);
    };

    const handleEditBadge = (badge: Badge) => {
        setSelectedBadge(badge);
        setEditorOpen(true);
    };

    const handleToggleActive = async (badge: Badge) => {
        try {
            const res = await fetch(`/api/admin/badges/${badge.id}`, {
                method: "PUT",
                body: JSON.stringify({ is_active: !badge.is_active }),
            });
            if (!res.ok) throw new Error("Failed to toggle status");

            setBadges(prev => prev.map(b =>
                b.id === badge.id ? { ...b, is_active: !badge.is_active } : b
            ));
            toast.success(`Badge ${badge.is_active ? "paused" : "activated"}`);
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleToggleFilterable = async (badge: Badge) => {
        try {
            const res = await fetch(`/api/admin/badges/${badge.id}`, {
                method: "PUT",
                body: JSON.stringify({ is_filterable: !badge.is_filterable }),
            });
            if (!res.ok) throw new Error("Failed to update filterable setting");

            setBadges(prev => prev.map(b =>
                b.id === badge.id ? { ...b, is_filterable: !badge.is_filterable } : b
            ));
            toast.success(`Badge is now ${!badge.is_filterable ? "filterable" : "hidden from filters"}`);
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleReorder = async (newBadges: BadgeWithCount[]) => {
        // Optimistic update
        const previousBadges = [...badges];
        setBadges(newBadges);

        try {
            const res = await fetch("/api/admin/badges/reorder", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newBadges.map(b => ({ id: b.id, priority: b.priority }))),
            });
            if (!res.ok) throw new Error("Failed to save order");
            toast.success("Order saved", { duration: 1000 });
        } catch (error: any) {
            toast.error(error.message);
            setBadges(previousBadges);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;

        try {
            setIsDeleting(true);
            const res = await fetch(`/api/admin/badges/${confirmDelete.id}`, { method: "DELETE" });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to delete badge");

            setBadges(prev => prev.filter(b => b.id !== confirmDelete.id));
            toast.success("Badge deleted permanentely");
            setConfirmDelete(null);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="border-b border-border/50 px-4 md:px-8 py-5">
                <AdminPageHeader
                    title="Badge Management"
                    description="Configure visually distinct badges to highlight premium status, amenities, and trust."
                    breadcrumbs={[{ label: "Admin" }, { label: "Badges" }]}
                    actions={
                        <button
                            type="button"
                            onClick={handleAddBadge}
                            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:scale-105 active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            Add Badge
                        </button>
                    }
                />
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-8">
                <div className="mx-auto max-w-6xl">
                    {/* Priority Hint */}
                    <div className="mb-6 flex items-start gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/30 p-4 text-sm text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-400 animate-in fade-in slide-in-from-top-2">
                        <Sparkles className="h-5 w-5 shrink-0" />
                        <div className="space-y-1">
                            <p className="font-bold">Priority Ranking Tip:</p>
                            <p className="leading-relaxed text-muted-foreground/80">
                                Badges appear in search based on priority: <span className="font-mono text-[11px] font-bold">Plan Badges: 0-9</span> • <span className="font-mono text-[11px] font-bold">Trust: 10-19</span> • <span className="font-mono text-[11px] font-bold">Status: 20-29</span> • <span className="font-mono text-[11px] font-bold">Identity: 30-39</span> • <span className="font-mono text-[11px] font-bold">Amenities: 40-49</span>.
                                Drag handles to reorder instantly.
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
                            <p className="mt-4 text-sm font-medium text-muted-foreground">Loading badge system...</p>
                        </div>
                    ) : (
                        <BadgeTable
                            badges={badges}
                            onEdit={handleEditBadge}
                            onDelete={(b) => setConfirmDelete(b)}
                            onToggleActive={handleToggleActive}
                            onToggleFilterable={handleToggleFilterable}
                            onReorder={handleReorder}
                        />
                    )}
                </div>
            </div>

            <BadgeEditorModal
                isOpen={editorOpen}
                onClose={() => setEditorOpen(false)}
                onSave={loadBadges}
                badge={selectedBadge}
                allBadgeSlugs={badges.filter(b => b.id !== selectedBadge?.id).map(b => b.slug)}
            />

            <ConfirmDialog
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={handleDelete}
                title="Delete Badge?"
                description={`This will permanently remove the "${confirmDelete?.name}" badge. This action cannot be undone.`}
                confirmLabel="Delete Badge"
                variant="destructive"
                loading={isDeleting}
            />
        </div>
    );
}
