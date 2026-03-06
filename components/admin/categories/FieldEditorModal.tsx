"use client";

import { useState, useEffect } from "react";
import { X, Save, Trash2, Eye } from "lucide-react";
import OptionsBuilder from "./OptionsBuilder";

const FIELD_TYPES = [
    { value: "text", label: "Short Text" },
    { value: "textarea", label: "Long Text" },
    { value: "number", label: "Number" },
    { value: "currency", label: "Currency (₱)" },
    { value: "boolean", label: "Yes / No Toggle" },
    { value: "select", label: "Dropdown (Single)" },
    { value: "multi_select", label: "Multi-Select" },
    { value: "url", label: "URL / Link" },
    { value: "phone", label: "Phone Number" },
    { value: "email", label: "Email Address" },
    { value: "image_gallery", label: "Image Gallery" },
    { value: "menu_items", label: "Menu Items" },
    { value: "time_range", label: "Time Range" },
    { value: "json", label: "Raw JSON" },
];

function toSnakeCase(str: string) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "_")
        .replace(/_+/g, "_");
}

interface FieldEditorModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (field: any) => Promise<void>;
    onDelete?: () => Promise<void>;
    categoryId: string;
    subcategories: Array<{ id: string; name: string }>;
    initialData?: any;
}

function FieldPreview({ field }: { field: any }) {
    return (
        <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-1.5">
            <label className="text-xs font-bold text-foreground">
                {field.field_label || "Field Label"}
                {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.help_text && <p className="text-[11px] text-muted-foreground">{field.help_text}</p>}
            {field.field_type === "text" && (
                <input className="w-full rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm text-muted-foreground" placeholder={field.placeholder || "Enter text..."} disabled />
            )}
            {field.field_type === "textarea" && (
                <textarea className="w-full rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm text-muted-foreground resize-none" placeholder={field.placeholder || "Enter text..."} rows={3} disabled />
            )}
            {field.field_type === "number" && (
                <input type="number" className="w-full rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm text-muted-foreground" placeholder={field.placeholder || "0"} disabled />
            )}
            {field.field_type === "currency" && (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-muted-foreground">₱</span>
                    <input type="number" className="flex-1 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm text-muted-foreground" placeholder="0.00" disabled />
                </div>
            )}
            {field.field_type === "boolean" && (
                <div className="flex items-center gap-2">
                    <div className="h-5 w-9 rounded-full bg-muted border border-border/50" />
                    <span className="text-sm text-muted-foreground">No</span>
                </div>
            )}
            {(field.field_type === "select" || field.field_type === "multi_select") && (
                <select className="w-full rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm text-muted-foreground" disabled>
                    <option>Select an option...</option>
                    {(field.options || []).map((o: string, i: number) => (
                        <option key={i}>{o}</option>
                    ))}
                </select>
            )}
            {field.field_type === "url" && (
                <input type="url" className="w-full rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm text-muted-foreground" placeholder="https://" disabled />
            )}
            {field.field_type === "phone" && (
                <input type="tel" className="w-full rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm text-muted-foreground" placeholder="+63 9XX XXX XXXX" disabled />
            )}
            {field.field_type === "email" && (
                <input type="email" className="w-full rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm text-muted-foreground" placeholder="example@email.com" disabled />
            )}
            {field.field_type === "image_gallery" && (
                <div className="rounded-lg border border-dashed border-border/50 bg-background/50 p-4 text-center text-xs text-muted-foreground">📷 Image Gallery Upload</div>
            )}
            {field.field_type === "menu_items" && (
                <div className="rounded-lg border border-dashed border-border/50 bg-background/50 p-4 text-center text-xs text-muted-foreground">🍽️ Menu Items Builder</div>
            )}
            {field.field_type === "time_range" && (
                <div className="flex items-center gap-2">
                    <input type="time" className="rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm text-muted-foreground" disabled />
                    <span className="text-xs text-muted-foreground">to</span>
                    <input type="time" className="rounded-lg border border-border/50 bg-background px-3 py-1.5 text-sm text-muted-foreground" disabled />
                </div>
            )}
        </div>
    );
}

export default function FieldEditorModal({
    open, onClose, onSave, onDelete, categoryId, subcategories, initialData
}: FieldEditorModalProps) {
    const [form, setForm] = useState<any>({
        category_id: categoryId,
        subcategory_id: "",
        field_label: "",
        field_name: "",
        field_type: "text",
        is_required: false,
        placeholder: "",
        help_text: "",
        options: [] as string[],
        validation_rules: {},
        sort_order: 0,
        is_active: true,
    });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [autoSlug, setAutoSlug] = useState(true);

    useEffect(() => {
        if (initialData) {
            setForm({
                ...initialData,
                options: initialData.options?.values ?? [],
                validation_rules: initialData.validation_rules ?? {},
            });
            setAutoSlug(false);
        } else {
            setForm({
                category_id: categoryId,
                subcategory_id: "",
                field_label: "",
                field_name: "",
                field_type: "text",
                is_required: false,
                placeholder: "",
                help_text: "",
                options: [],
                validation_rules: {},
                sort_order: 0,
                is_active: true,
            });
            setAutoSlug(true);
        }
    }, [initialData, categoryId, open]);

    function handleLabelChange(label: string) {
        setForm((prev: any) => ({
            ...prev,
            field_label: label,
            field_name: autoSlug ? toSnakeCase(label) : prev.field_name,
        }));
    }

    async function handleSave() {
        if (!form.field_label || !form.field_name || !form.field_type) return;
        setSaving(true);
        try {
            const payload = {
                ...form,
                options: ["select", "multi_select"].includes(form.field_type)
                    ? { values: form.options }
                    : null,
                validation_rules: ["number", "currency"].includes(form.field_type)
                    ? form.validation_rules
                    : null,
            };
            await onSave(payload);
            onClose();
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!onDelete || !window.confirm("Delete this field? This cannot be undone.")) return;
        setDeleting(true);
        try {
            await onDelete();
            onClose();
        } finally {
            setDeleting(false);
        }
    }

    if (!open) return null;

    const needsOptions = ["select", "multi_select"].includes(form.field_type);
    const needsValidation = ["number", "currency"].includes(form.field_type);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
            <div
                className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-border/50 bg-background shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
                    <h3 className="text-lg font-bold">{initialData ? "Edit Field" : "Add Dynamic Field"}</h3>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowPreview(!showPreview)}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${showPreview ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
                        >
                            <Eye className="h-3.5 w-3.5" />
                            Preview
                        </button>
                        <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {showPreview && (
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Field Preview</p>
                            <FieldPreview field={form} />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Field Label <span className="text-red-500">*</span></label>
                            <input
                                className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                                placeholder="e.g. Cuisine Type"
                                value={form.field_label}
                                onChange={(e) => handleLabelChange(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Field Name (snake_case) <span className="text-red-500">*</span></label>
                            <input
                                className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm font-mono outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                                placeholder="cuisine_type"
                                value={form.field_name}
                                onChange={(e) => { setAutoSlug(false); setForm((p: any) => ({ ...p, field_name: e.target.value })); }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Field Type <span className="text-red-500">*</span></label>
                            <select
                                className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary/50"
                                value={form.field_type}
                                onChange={(e) => setForm((p: any) => ({ ...p, field_type: e.target.value, options: [] }))}
                            >
                                {FIELD_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subcategory</label>
                            <select
                                className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary/50"
                                value={form.subcategory_id || ""}
                                onChange={(e) => setForm((p: any) => ({ ...p, subcategory_id: e.target.value || null }))}
                            >
                                <option value="">All subcategories</option>
                                {subcategories.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Placeholder</label>
                            <input
                                className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                                placeholder="Placeholder text..."
                                value={form.placeholder}
                                onChange={(e) => setForm((p: any) => ({ ...p, placeholder: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sort Order</label>
                            <input
                                type="number"
                                className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary/50"
                                value={form.sort_order}
                                onChange={(e) => setForm((p: any) => ({ ...p, sort_order: Number(e.target.value) }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Help Text</label>
                        <input
                            className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                            placeholder="Shown below the field in forms..."
                            value={form.help_text}
                            onChange={(e) => setForm((p: any) => ({ ...p, help_text: e.target.value }))}
                        />
                    </div>

                    {needsOptions && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Options</label>
                            <OptionsBuilder options={form.options} onChange={(opts) => setForm((p: any) => ({ ...p, options: opts }))} />
                        </div>
                    )}

                    {needsValidation && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Min Value</label>
                                <input
                                    type="number"
                                    className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary/50"
                                    placeholder="No minimum"
                                    value={form.validation_rules?.min ?? ""}
                                    onChange={(e) => setForm((p: any) => ({ ...p, validation_rules: { ...p.validation_rules, min: e.target.value || undefined } }))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Max Value</label>
                                <input
                                    type="number"
                                    className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary/50"
                                    placeholder="No maximum"
                                    value={form.validation_rules?.max ?? ""}
                                    onChange={(e) => setForm((p: any) => ({ ...p, validation_rules: { ...p.validation_rules, max: e.target.value || undefined } }))}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.is_required}
                                onChange={(e) => setForm((p: any) => ({ ...p, is_required: e.target.checked }))}
                                className="h-4 w-4 accent-primary rounded"
                            />
                            <span className="text-sm font-medium">Required field</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.is_active}
                                onChange={(e) => setForm((p: any) => ({ ...p, is_active: e.target.checked }))}
                                className="h-4 w-4 accent-primary rounded"
                            />
                            <span className="text-sm font-medium">Active</span>
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border/50 px-6 py-4">
                    {initialData && onDelete ? (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                        >
                            <Trash2 className="h-4 w-4" />
                            {deleting ? "Deleting..." : "Delete Field"}
                        </button>
                    ) : <div />}
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={onClose} className="rounded-xl border border-border/50 px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted">
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || !form.field_label || !form.field_name}
                            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {saving ? "Saving..." : (initialData ? "Update Field" : "Save Field")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
