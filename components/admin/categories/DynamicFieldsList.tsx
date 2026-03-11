"use client";

import { useState } from "react";
import { GripVertical, Plus, Pencil, ToggleLeft, ToggleRight, Trash2, Lock } from "lucide-react";
import * as Icons from "lucide-react";
import FieldEditorModal from "./FieldEditorModal";

interface Field {
    id: string;
    field_label: string;
    field_name: string;
    field_type: string;
    is_required: boolean;
    is_active: boolean;
    sort_order: number;
    subcategory_id?: string | null;
    [key: string]: any;
}

interface DynamicFieldsListProps {
    categoryId: string;
    isSubcategory?: boolean;
    fields: Field[];
    subcategories: Array<{ id: string; name: string }>;
    onRefresh: () => void;
}

const FIELD_TYPE_LABELS: Record<string, string> = {
    text: "Text",
    textarea: "Textarea",
    number: "Number",
    currency: "Currency",
    boolean: "Toggle",
    select: "Dropdown",
    multi_select: "Multi-select",
    url: "URL",
    phone: "Phone",
    email: "Email",
    image_gallery: "Images",
    menu_items: "Menu",
    time_range: "Time Range",
    json: "JSON",
};

export default function DynamicFieldsList({ categoryId, isSubcategory, fields, subcategories, onRefresh }: DynamicFieldsListProps) {
    const [addOpen, setAddOpen] = useState(false);
    const [editField, setEditField] = useState<Field | null>(null);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [localFields, setLocalFields] = useState<Field[]>(fields);

    async function handleDragEnd() {
        if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
            const reordered = [...localFields];
            const [moved] = reordered.splice(dragIndex, 1);
            reordered.splice(dragOverIndex, 0, moved);
            setLocalFields(reordered);

            // Save new order
            await fetch("/api/admin/category-fields", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reorder: true,
                    items: reordered.map((f, i) => ({ id: f.id, sort_order: i })),
                }),
            });
        }
        setDragIndex(null);
        setDragOverIndex(null);
    }

    async function handleSaveField(payload: any) {
        const url = editField
            ? `/api/admin/category-fields/${editField.id}`
            : "/api/admin/category-fields";
        const method = editField ? "PATCH" : "POST";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, category_id: categoryId }),
        });

        if (!res.ok) {
            const err = await res.json();
            alert(err.error || "Failed to save field");
            return;
        }
        setEditField(null);
        onRefresh();
    }

    async function handleDeleteField() {
        if (!editField) return;
        const res = await fetch(`/api/admin/category-fields/${editField.id}`, { method: "DELETE" });
        if (!res.ok) { alert("Failed to delete field"); return; }
        setEditField(null);
        onRefresh();
    }

    async function toggleActive(field: Field) {
        await fetch(`/api/admin/category-fields/${field.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_active: !field.is_active }),
        });
        onRefresh();
    }

    // Sync local order when props change
    if (fields !== localFields && dragIndex === null) {
        setLocalFields(fields);
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground">Dynamic Fields</h4>
                <button
                    type="button"
                    onClick={() => { setEditField(null); setAddOpen(true); }}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Add Field
                </button>
            </div>

            {localFields.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/50 py-8 text-center text-sm text-muted-foreground">
                    No dynamic fields yet. Click "Add Field" to create one.
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-border/50">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/20 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            <tr>
                                <th className="w-8 px-3 py-3" />
                                <th className="px-3 py-3 text-left">Label</th>
                                <th className="px-3 py-3 text-left">Type</th>
                                <th className="px-3 py-3 text-center">Required</th>
                                <th className="px-3 py-3 text-center">Active</th>
                                <th className="px-3 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {localFields.map((field, i) => {
                                const isInherited = field.category_id !== categoryId && !field.subcategory_id;
                                const isSubcategorySpecific = !!field.subcategory_id;

                                return (
                                    <tr
                                        key={field.id}
                                        draggable={!isInherited}
                                        onDragStart={() => !isInherited && setDragIndex(i)}
                                        onDragOver={(e) => {
                                            if (isInherited) return;
                                            e.preventDefault();
                                            setDragOverIndex(i);
                                        }}
                                        onDragEnd={handleDragEnd}
                                        className={`transition-colors hover:bg-muted/20 ${dragOverIndex === i && dragIndex !== i ? "bg-primary/5 border-t-2 border-primary/30" : ""} ${!field.is_active ? "opacity-50" : ""}`}
                                    >
                                        <td className="px-3 py-3">
                                            {!isInherited ? (
                                                <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab active:cursor-grabbing" />
                                            ) : (
                                                <Icons.Lock className="h-3.5 w-3.5 text-muted-foreground/30" />
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{field.field_label}</span>
                                                {isInherited && (
                                                    <span className="text-[10px] text-primary/70 font-bold uppercase tracking-tighter">Inherited from Parent</span>
                                                )}
                                                {isSubcategorySpecific && field.subcategory_id === categoryId && (
                                                    <span className="text-[10px] text-amber-600 font-bold uppercase tracking-tighter">Specific to this Subcategory</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="rounded-md bg-muted/50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider">
                                                {FIELD_TYPE_LABELS[field.field_type] || field.field_type}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <span className={`text-[10px] font-bold ${field.is_required ? "text-red-500" : "text-muted-foreground"}`}>
                                                {field.is_required ? "Yes" : "No"}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => !isInherited && toggleActive(field)}
                                                className={isInherited ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                                                disabled={isInherited}
                                            >
                                                {field.is_active
                                                    ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                                                    : <ToggleLeft className="h-5 w-5 text-muted-foreground/40" />
                                                }
                                            </button>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            {!isInherited ? (
                                                <button
                                                    type="button"
                                                    onClick={() => { setEditField(field); setAddOpen(true); }}
                                                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                            ) : (
                                                <span className="text-[10px] text-muted-foreground italic">Read-only</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <FieldEditorModal
                open={addOpen}
                onClose={() => { setAddOpen(false); setEditField(null); }}
                onSave={handleSaveField}
                onDelete={editField ? handleDeleteField : undefined}
                categoryId={categoryId}
                isSubcategory={isSubcategory}
                subcategories={subcategories}
                initialData={editField ?? undefined}
            />
        </div>
    );
}
