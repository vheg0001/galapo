"use client";

import { useState, useCallback, useEffect } from "react";
import { GripVertical, Edit2, Trash2, CheckCircle2, XCircle, ExternalLink, Hash, Loader2, Search } from "lucide-react";
import { Badge } from "@/lib/types";
import { cn } from "@/lib/utils";
import BadgeChip from "@/components/shared/BadgeChip";

interface BadgeTableProps {
    badges: (Badge & { assigned_count: number })[];
    onEdit: (badge: Badge) => void;
    onDelete: (badge: Badge) => void;
    onToggleActive: (badge: Badge) => void;
    onToggleFilterable: (badge: Badge) => void;
    onReorder: (newBadges: (Badge & { assigned_count: number })[]) => void;
}

export default function BadgeTable({
    badges,
    onEdit,
    onDelete,
    onToggleActive,
    onToggleFilterable,
    onReorder,
}: BadgeTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    const filteredBadges = badges.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = "move";
        // Ghost image styling is handled by native DnD
    };

    const handleDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        if (id !== draggedId) {
            setDragOverId(id);
        }
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (draggedId && draggedId !== targetId) {
            const newBadges = [...badges];
            const draggedIdx = newBadges.findIndex(b => b.id === draggedId);
            const targetIdx = newBadges.findIndex(b => b.id === targetId);

            const [item] = newBadges.splice(draggedIdx, 1);
            newBadges.splice(targetIdx, 0, item);

            // Re-calculate priorities based on new order
            const reordered = newBadges.map((b, i) => ({
                ...b,
                priority: (i + 1) * 10
            }));

            onReorder(reordered);
        }
        setDraggedId(null);
        setDragOverId(null);
    };


    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 px-1">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <input
                        type="text"
                        placeholder="Search flairs by name or slug..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10 w-full pl-10 pr-4 rounded-xl border border-border/50 bg-background/50 text-sm focus:border-primary/50 focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-border/50 bg-background/40 shadow-sm backdrop-blur-sm ring-1 ring-border/50">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-border/50 bg-muted/20">
                        <tr>
                            <th className="w-10 px-4 py-4"></th>
                            <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Preview</th>
                            <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Name</th>
                            <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Type</th>
                            <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">Auto-Expires</th>
                            <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">Filterable</th>
                            <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">Usage</th>
                            <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">Active</th>
                            <th className="px-4 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        {filteredBadges.map((badge) => (
                            <tr
                                key={badge.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, badge.id)}
                                onDragOver={(e) => handleDragOver(e, badge.id)}
                                onDrop={(e) => handleDrop(e, badge.id)}
                                className={cn(
                                    "group transition-colors",
                                    draggedId === badge.id && "opacity-40 grayscale",
                                    dragOverId === badge.id && "bg-primary/5 border-t-2 border-primary"
                                )}
                            >
                                <td className="px-4 py-3">
                                    <div className="cursor-grab active:cursor-grabbing text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors">
                                        <GripVertical className="h-4 w-4" />
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <BadgeChip badge={badge} size="md" showTooltip={false} />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-foreground">{badge.name}</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">{badge.slug}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight",
                                        badge.type === "plan" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" :
                                            badge.type === "system" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" :
                                                "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                    )}>
                                        {badge.type}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {badge.auto_expires ? (
                                        <div className="flex flex-col items-center">
                                            <span className="text-emerald-500 font-bold">Yes</span>
                                            <span className="text-[10px] text-muted-foreground">{badge.default_expiry_days}d</span>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground/40">No</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={() => onToggleFilterable(badge)}
                                        className={cn(
                                            "transition-colors",
                                            badge.is_filterable ? "text-primary" : "text-muted-foreground/30 hover:text-muted-foreground/50"
                                        )}
                                    >
                                        {badge.is_filterable ? <CheckCircle2 className="h-5 w-5 mx-auto" /> : <XCircle className="h-5 w-5 mx-auto" />}
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="font-mono font-bold text-muted-foreground">
                                        {badge.assigned_count}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={() => onToggleActive(badge)}
                                        className={cn(
                                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all",
                                            badge.is_active
                                                ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                                : "bg-red-50 text-red-600 hover:bg-red-100"
                                        )}
                                    >
                                        {badge.is_active ? "Active" : "Paused"}
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => onEdit(badge)}
                                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all"
                                            title="Edit Flair"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => onDelete(badge)}
                                            disabled={badge.assigned_count > 0 || badge.type === "plan"}
                                            className={cn(
                                                "p-1.5 rounded-lg transition-all",
                                                badge.assigned_count > 0 || badge.type === "plan"
                                                    ? "text-muted-foreground/20 cursor-not-allowed"
                                                    : "text-muted-foreground hover:bg-red-50 hover:text-red-500"
                                            )}
                                            title={badge.assigned_count > 0 ? "Cannot delete assigned flair" : badge.type === "plan" ? "Cannot delete plan badge" : "Delete Flair"}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredBadges.length === 0 && (
                            <tr>
                                <td colSpan={9} className="py-20 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="p-4 rounded-full bg-muted/30">
                                            <Search className="h-8 w-8 text-muted-foreground/20" />
                                        </div>
                                        <p className="text-sm font-medium">No flairs found matching your search.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
