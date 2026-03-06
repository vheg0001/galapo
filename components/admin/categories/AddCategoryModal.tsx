"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";
import IconPicker from "./IconPicker";

function toSlug(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

interface AddCategoryModalProps {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    parentCategories: Array<{ id: string; name: string }>;
}

export default function AddCategoryModal({ open, onClose, onCreated, parentCategories }: AddCategoryModalProps) {
    const [form, setForm] = useState({
        name: "",
        slug: "",
        description: "",
        icon: "",
        parent_id: "",
        sort_order: 0,
        is_active: true,
    });
    const [saving, setSaving] = useState(false);
    const [autoSlug, setAutoSlug] = useState(true);

    function handleNameChange(name: string) {
        setForm((prev) => ({
            ...prev,
            name,
            slug: autoSlug ? toSlug(name) : prev.slug,
        }));
    }

    async function handleSave() {
        if (!form.name || !form.slug) return;
        setSaving(true);
        try {
            const res = await fetch("/api/admin/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    parent_id: form.parent_id || null,
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                alert(err.error || "Failed to create category");
                return;
            }
            setForm({ name: "", slug: "", description: "", icon: "", parent_id: "", sort_order: 0, is_active: true });
            setAutoSlug(true);
            onCreated();
            onClose();
        } finally {
            setSaving(false);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
            <div
                className="relative z-10 w-full max-w-lg rounded-2xl border border-border/50 bg-background shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
                    <h3 className="text-lg font-bold">Add Category</h3>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Name <span className="text-red-500">*</span></label>
                            <input
                                className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                                placeholder="e.g. Food & Dining"
                                value={form.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Slug <span className="text-red-500">*</span></label>
                            <input
                                className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm font-mono outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                                placeholder="food-and-dining"
                                value={form.slug}
                                onChange={(e) => { setAutoSlug(false); setForm((p) => ({ ...p, slug: e.target.value })); }}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                        <textarea
                            className="w-full resize-none rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                            placeholder="Brief description..."
                            rows={2}
                            value={form.description}
                            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Icon</label>
                        <IconPicker value={form.icon} onChange={(icon) => setForm((p) => ({ ...p, icon }))} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Parent Category</label>
                            <select
                                className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary/50"
                                value={form.parent_id}
                                onChange={(e) => setForm((p) => ({ ...p, parent_id: e.target.value }))}
                            >
                                <option value="">None — this is a parent category</option>
                                {parentCategories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sort Order</label>
                            <input
                                type="number"
                                className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary/50"
                                value={form.sort_order}
                                onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                            className="h-4 w-4 accent-primary rounded"
                        />
                        <span className="text-sm font-medium">Active (visible to public)</span>
                    </label>
                </div>

                <div className="flex justify-end gap-3 border-t border-border/50 px-6 py-4">
                    <button type="button" onClick={onClose} className="rounded-xl border border-border/50 px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted">Cancel</button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !form.name || !form.slug}
                        className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? "Creating..." : "Create Category"}
                    </button>
                </div>
            </div>
        </div>
    );
}
