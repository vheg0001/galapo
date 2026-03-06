"use client";

import { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { Save, Trash2, Loader2 } from "lucide-react";
import IconPicker from "./IconPicker";
import DynamicFieldsList from "./DynamicFieldsList";

function toSlug(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

interface CategoryDetailProps {
    categoryId: string;
    parentCategories: Array<{ id: string; name: string }>;
    onSaved: () => void;
    onDeleted: () => void;
}

export default function CategoryDetail({ categoryId, parentCategories, onSaved, onDeleted }: CategoryDetailProps) {
    const [cat, setCat] = useState<any>(null);
    const [fields, setFields] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [autoSlug, setAutoSlug] = useState(false);

    async function load() {
        setLoading(true);
        const res = await fetch(`/api/admin/categories/${categoryId}`);
        const data = await res.json();
        if (data.data) {
            setCat(data.data);
            setFields(data.fields || []);
        }
        setLoading(false);
    }

    useEffect(() => { load(); }, [categoryId]);

    async function handleSave() {
        if (!cat) return;
        setSaving(true);
        const res = await fetch(`/api/admin/categories/${categoryId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cat),
        });
        setSaving(false);
        if (res.ok) {
            onSaved();
        } else {
            const err = await res.json();
            alert(err.error || "Failed to save");
        }
    }

    async function handleDelete() {
        if (!window.confirm(`Delete "${cat?.name}"? This cannot be undone.`)) return;
        setDeleting(true);
        setDeleteError("");
        const res = await fetch(`/api/admin/categories/${categoryId}`, { method: "DELETE" });
        if (res.ok) {
            onDeleted();
        } else {
            const err = await res.json();
            setDeleteError(err.error || "Failed to delete");
        }
        setDeleting(false);
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!cat) return null;

    const Icon = cat.icon ? (Icons as any)[cat.icon] : null;
    const subcategories = cat.parent_id === null ? [] : []; // detail view only needed for fields

    return (
        <div className="h-full overflow-y-auto space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                {Icon && <Icon className="h-6 w-6 text-primary shrink-0" />}
                <div>
                    <h3 className="text-lg font-bold">{cat.name}</h3>
                    <p className="text-xs text-muted-foreground">{cat.listing_count ?? 0} listing(s) in this category</p>
                </div>
            </div>

            {/* Info Section */}
            <div className="space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category Info</h4>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Name</label>
                        <input
                            className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                            value={cat.name}
                            onChange={(e) => setCat((p: any) => ({
                                ...p,
                                name: e.target.value,
                                slug: autoSlug ? toSlug(e.target.value) : p.slug,
                            }))}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Slug</label>
                        <input
                            className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm font-mono outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                            value={cat.slug}
                            onChange={(e) => { setAutoSlug(false); setCat((p: any) => ({ ...p, slug: e.target.value })); }}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Description</label>
                    <textarea
                        className="w-full resize-none rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                        rows={2}
                        value={cat.description || ""}
                        onChange={(e) => setCat((p: any) => ({ ...p, description: e.target.value }))}
                        placeholder="Optional description..."
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Icon</label>
                    <IconPicker value={cat.icon || ""} onChange={(icon) => setCat((p: any) => ({ ...p, icon }))} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Parent Category</label>
                        <select
                            className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary/50"
                            value={cat.parent_id || ""}
                            onChange={(e) => setCat((p: any) => ({ ...p, parent_id: e.target.value || null }))}
                        >
                            <option value="">None (Top-Level)</option>
                            {parentCategories.filter((p) => p.id !== categoryId).map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Sort Order</label>
                        <input
                            type="number"
                            className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary/50"
                            value={cat.sort_order ?? 0}
                            onChange={(e) => setCat((p: any) => ({ ...p, sort_order: Number(e.target.value) }))}
                        />
                    </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={cat.is_active ?? true}
                        onChange={(e) => setCat((p: any) => ({ ...p, is_active: e.target.checked }))}
                        className="h-4 w-4 accent-primary rounded"
                    />
                    <span className="text-sm font-medium">Active (visible to public)</span>
                </label>

                {/* Save / Delete */}
                <div className="flex items-center justify-between pt-2">
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                        <Trash2 className="h-4 w-4" />
                        {deleting ? "Deleting..." : "Delete Category"}
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>

                {deleteError && (
                    <p className="text-sm text-red-600 bg-red-500/10 rounded-xl px-4 py-2">{deleteError}</p>
                )}
            </div>

            {/* Dynamic Fields Section */}
            <div className="border-t border-border/50 pt-6">
                <DynamicFieldsList
                    categoryId={categoryId}
                    fields={fields}
                    subcategories={[]} /* populated from parent if needed */
                    onRefresh={load}
                />
            </div>
        </div>
    );
}
