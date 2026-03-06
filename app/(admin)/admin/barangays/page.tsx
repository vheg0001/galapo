"use client";

import { useState, useEffect } from "react";
import { Plus, MapPin, Pencil, Trash2, GripVertical } from "lucide-react";
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";
import BarangayModal from "@/components/admin/barangays/BarangayModal";

function getGroup(sortOrder: number): string {
    if (sortOrder < 100) return "Olongapo City";
    if (sortOrder < 200) return "SBFZ";
    if (sortOrder < 300) return "Subic";
    if (sortOrder < 400) return "Castillejos";
    if (sortOrder < 500) return "San Marcelino";
    return "Other";
}

const GROUP_COLORS: Record<string, string> = {
    "Olongapo City": "bg-blue-500/10 text-blue-600 border-blue-500/20",
    "SBFZ": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    "Subic": "bg-violet-500/10 text-violet-600 border-violet-500/20",
    "Castillejos": "bg-amber-500/10 text-amber-600 border-amber-500/20",
    "San Marcelino": "bg-pink-500/10 text-pink-600 border-pink-500/20",
    "Other": "bg-muted/50 text-muted-foreground border-border/50",
};

export default function AdminBarangaysPage() {
    const [barangays, setBarangays] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [grouped, setGrouped] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<any | null>(null);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    async function load() {
        setLoading(true);
        const res = await fetch("/api/admin/barangays");
        const data = await res.json();
        setBarangays(data.data ?? []);
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    async function handleToggle(b: any) {
        await fetch(`/api/admin/barangays/${b.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_active: !b.is_active }),
        });
        load();
    }

    async function handleDelete(b: any) {
        if (!window.confirm(`Delete "${b.name}"? This can't be undone.`)) return;
        const res = await fetch(`/api/admin/barangays/${b.id}`, { method: "DELETE" });
        if (!res.ok) {
            const err = await res.json();
            alert(err.error || "Failed to delete");
        } else {
            load();
        }
    }

    async function handleDragEnd() {
        if (dragIndex === null || dragOverIndex === null || dragIndex === dragOverIndex) return;
        const sorted = [...filtered];
        const [moved] = sorted.splice(dragIndex, 1);
        sorted.splice(dragOverIndex, 0, moved);

        // Update sort_order values and persist
        const updates = sorted.map((b, i) => ({
            id: b.id, sort_order: b.sort_order < 100
                ? i + 1 // preserve group by not jumping ranges  
                : b.sort_order + (dragIndex < dragOverIndex ? 1 : -1)
        }));
        setBarangays(sorted);
        await fetch(`/api/admin/barangays/${updates[0].id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reorder: true, items: sorted.map((b, i) => ({ id: b.id, sort_order: b.sort_order })) }),
        });
        setDragIndex(null);
        setDragOverIndex(null);
    }

    const filtered = barangays.filter((b) =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.slug.toLowerCase().includes(search.toLowerCase())
    );

    const groups = grouped ? [...new Set(filtered.map((b) => getGroup(b.sort_order)))] : [];

    return (
        <div className="px-8 py-6 space-y-6">
            <AdminPageHeader
                title="Barangays & Areas"
                description="Manage all barangays and area groupings used in listings."
                breadcrumbs={[{ label: "Admin" }, { label: "Barangays" }]}
                actions={
                    <button
                        type="button"
                        onClick={() => { setEditTarget(null); setModalOpen(true); }}
                        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        Add Area
                    </button>
                }
            />

            {/* Toolbar */}
            <div className="flex items-center gap-4">
                <input
                    className="w-64 rounded-xl border border-border/50 bg-background/50 px-4 py-2 text-sm outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                    placeholder="Search barangays..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                        type="checkbox"
                        checked={grouped}
                        onChange={(e) => setGrouped(e.target.checked)}
                        className="h-4 w-4 accent-primary"
                    />
                    Group by area
                </label>
                <span className="text-xs text-muted-foreground">{filtered.length} areas</span>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-[2rem] border border-border/50 bg-background/40 shadow-sm backdrop-blur-sm ring-1 ring-border/50">
                <table className="w-full text-sm">
                    <thead className="bg-muted/20 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50">
                        <tr>
                            <th className="w-8 px-4 py-3" />
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-left">Slug</th>
                            <th className="px-4 py-3 text-left">Group</th>
                            <th className="px-4 py-3 text-center">Sort #</th>
                            <th className="px-4 py-3 text-center">Listings</th>
                            <th className="px-4 py-3 text-center">Active</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        {loading ? (
                            [...Array(8)].map((_, i) => (
                                <tr key={i}>
                                    {[...Array(8)].map((_, j) => (
                                        <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-muted/50 animate-pulse" /></td>
                                    ))}
                                </tr>
                            ))
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="py-20 text-center text-sm text-muted-foreground">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="rounded-full bg-muted/30 p-4"><MapPin className="h-8 w-8 text-muted-foreground/30" /></div>
                                        <p>{search ? "No matching barangays." : "No barangays found."}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filtered.map((b, i) => (
                            <tr
                                key={b.id}
                                draggable
                                onDragStart={() => setDragIndex(i)}
                                onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i); }}
                                onDragEnd={handleDragEnd}
                                className={`transition-colors hover:bg-muted/20 ${dragOverIndex === i && dragIndex !== i ? "border-t-2 border-primary/50 bg-primary/5" : ""} ${!b.is_active ? "opacity-60" : ""}`}
                            >
                                <td className="px-4 py-3">
                                    <GripVertical className="h-4 w-4 text-muted-foreground/30 cursor-grab" />
                                </td>
                                <td className="px-4 py-3 font-medium">{b.name}</td>
                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{b.slug}</td>
                                <td className="px-4 py-3">
                                    <span className={`rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${GROUP_COLORS[getGroup(b.sort_order)]}`}>
                                        {getGroup(b.sort_order)}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center text-muted-foreground">{b.sort_order}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className="rounded-full bg-muted/50 px-2 py-0.5 text-xs font-semibold">{b.listing_count ?? 0}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        type="button"
                                        onClick={() => handleToggle(b)}
                                        className={`relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors ${b.is_active ? "bg-emerald-500" : "bg-muted"}`}
                                    >
                                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${b.is_active ? "translate-x-4.5" : "translate-x-0.5"}`} />
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            type="button"
                                            onClick={() => { setEditTarget(b); setModalOpen(true); }}
                                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(b)}
                                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-600 transition-colors cursor-pointer"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <BarangayModal
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditTarget(null); }}
                onSaved={load}
                initialData={editTarget}
            />
        </div>
    );
}
