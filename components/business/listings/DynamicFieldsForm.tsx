"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — DynamicFieldsForm Component (Module 9.1)
// ──────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import DynamicFieldRenderer from "./DynamicFieldRenderer";
import type { CategoryField } from "@/lib/types";

interface DynamicFieldsFormProps {
    categoryId: string;
    subcategoryId?: string;
    values: Record<string, any>;
    onChange: (values: Record<string, any>) => void;
}

export default function DynamicFieldsForm({
    categoryId,
    subcategoryId,
    values,
    onChange
}: DynamicFieldsFormProps) {
    const [fields, setFields] = useState<CategoryField[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchFields = async () => {
            if (!categoryId) return;
            setLoading(true);
            try {
                // In production, we'd fetch categories with fields already attached
                // or have a dedicated endpoint for fields.
                // For now, we fetch from categories API we updated earlier.
                const res = await fetch(`/api/categories?include_fields=true`);
                const json = await res.json();
                const categories = json.data || json;

                let foundFields: CategoryField[] = [];

                const parent = categories.find((c: any) => c.id === categoryId);
                if (parent) {
                    // Add parent fields
                    foundFields = [...(parent.fields || [])];

                    // Add subcategory fields if applicable
                    if (subcategoryId) {
                        const sub = parent.subcategories?.find((s: any) => s.id === subcategoryId);
                        if (sub) {
                            foundFields = [...foundFields, ...(sub.fields || [])];
                        }
                    }
                }

                setFields(foundFields.sort((a, b) => a.sort_order - b.sort_order));
            } catch (err) {
                console.error("Failed to fetch custom fields", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFields();
    }, [categoryId, subcategoryId]);

    const handleFieldChange = (fieldId: string, value: any) => {
        onChange({ ...values, [fieldId]: value });
    };

    if (loading) {
        return (
            <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-muted/50 rounded-full w-1/4" />
                <div className="h-12 bg-muted/30 rounded-2xl w-full" />
                <div className="h-4 bg-muted/50 rounded-full w-1/3 mt-4" />
                <div className="h-12 bg-muted/30 rounded-2xl w-full" />
                <div className="h-4 bg-muted/50 rounded-full w-1/4 mt-4" />
                <div className="h-12 bg-muted/30 rounded-2xl w-full" />
            </div>
        );
    }

    if (!loading && fields.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 rounded-2xl border border-dashed border-border/50 bg-muted/10">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40">
                    No extra attributes for this category
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {fields.map((field) => (
                <DynamicFieldRenderer
                    key={field.id}
                    field={field}
                    value={values[field.id]}
                    onChange={(val) => handleFieldChange(field.id, val)}
                />
            ))}
        </div>
    );
}
