"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";

function toSlug(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

function getGroup(sortOrder: number): string {
    if (sortOrder < 100) return "Olongapo City";
    if (sortOrder < 200) return "SBFZ";
    if (sortOrder < 300) return "Subic";
    if (sortOrder < 400) return "Castillejos";
    if (sortOrder < 500) return "San Marcelino";
    return "Other";
}

interface BarangayModalProps {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    initialData?: any; // null = add mode, otherwise = edit mode
}

export default function BarangayModal({ open, onClose, onSaved, initialData }: BarangayModalProps) {
    const [form, setForm] = useState({
        name: initialData?.name ?? "",
        slug: initialData?.slug ?? "",
        sort_order: initialData?.sort_order ?? 1,
        is_active: initialData?.is_active ?? true,
    });
    const [saving, setSaving] = useState(false);
    const [autoSlug, setAutoSlug] = useState(!initialData);

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
            const url = initialData
                ? `/api/admin/barangays/${initialData.id}`
                : "/api/admin/barangays";
            const method = initialData ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error || "Failed to save");
                return;
            }
            onSaved();
            onClose();
        } finally {
            setSaving(false);
        }
    }

    if (!open) return null;

    const previewGroup = getGroup(form.sort_order);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
            <div
                className="relative z-10 w-full max-w-md rounded-2xl border border-border/50 bg-background shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
                    <h3 className="text-lg font-bold">{initialData ? "Edit Barangay" : "Add Barangay"}</h3>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Name <span className="text-red-500">*</span></label>
                        <input
                            className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                            placeholder="e.g. Barangay East Tapinac"
                            value={form.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Slug <span className="text-red-500">*</span></label>
                        <input
                            className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm font-mono outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                            placeholder="barangay-east-tapinac"
                            value={form.slug}
                            onChange={(e) => { setAutoSlug(false); setForm((p) => ({ ...p, slug: e.target.value })); }}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sort Order</label>
                        <input
                            type="number"
                            className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary/50"
                            value={form.sort_order}
                            onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
                        />
                        <div className="rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                            <p className="font-semibold mb-1">Grouping by sort order:</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                <span>1–99 → Olongapo City</span>
                                <span>100–199 → SBFZ</span>
                                <span>200–299 → Subic</span>
                                <span>300–399 → Castillejos</span>
                                <span>400–499 → San Marcelino</span>
                                <span>500+ → Other</span>
                            </div>
                            <p className="mt-1.5 font-semibold text-foreground">Current group: <span className="text-primary">{previewGroup}</span></p>
                        </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                            className="h-4 w-4 accent-primary rounded"
                        />
                        <span className="text-sm font-medium">Active (visible in listings)</span>
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
                        {saving ? "Saving..." : "Save Barangay"}
                    </button>
                </div>
            </div>
        </div>
    );
}
