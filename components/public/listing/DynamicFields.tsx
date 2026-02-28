"use client";

import Image from "next/image";
import { ExternalLink, CheckCircle, XCircle } from "lucide-react";
import MenuDisplay from "./MenuDisplay";

interface FieldValue {
    id: string;
    value: any;
    category_fields: {
        id: string;
        field_name: string;
        field_label: string;
        field_type: string;
        sort_order: number;
        options: any;
    };
}

interface DynamicFieldsProps {
    fieldValues: FieldValue[];
    categoryName?: string;
}

function formatCurrency(val: number): string {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 0,
    }).format(val);
}

function FieldRenderer({ type, value, options }: { type: string; value: any; options?: any }) {
    if (value === null || value === undefined || value === "") return <span className="text-muted-foreground italic">Not specified</span>;

    switch (type) {
        case "text":
        case "phone":
        case "email":
        case "time_range":
            return <span className="text-foreground">{String(value)}</span>;

        case "textarea":
            return (
                <p className="text-foreground whitespace-pre-line leading-relaxed">{String(value)}</p>
            );

        case "number":
            return <span className="text-foreground font-medium">{Number(value).toLocaleString()}</span>;

        case "currency":
            return <span className="text-foreground font-medium">{formatCurrency(Number(value))}</span>;

        case "boolean":
            return value ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                    <CheckCircle className="h-4 w-4" /> Yes
                </span>
            ) : (
                <span className="inline-flex items-center gap-1.5 text-red-500 font-medium">
                    <XCircle className="h-4 w-4" /> No
                </span>
            );

        case "select":
            return (
                <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-3 py-1 text-sm font-medium text-foreground">
                    {String(value)}
                </span>
            );

        case "multi_select": {
            const values: string[] = Array.isArray(value) ? value : [value];
            return (
                <div className="flex flex-wrap gap-1.5">
                    {values.map((v) => (
                        <span key={v} className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-foreground">
                            {v}
                        </span>
                    ))}
                </div>
            );
        }

        case "url":
            return (
                <a
                    href={String(value)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline break-all"
                >
                    {String(value)}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
            );

        case "image_gallery": {
            const urls: string[] = Array.isArray(value) ? value : [value];
            return (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {urls.map((url, i) => (
                        <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                            <Image src={url} alt={`Image ${i + 1}`} fill className="object-cover" />
                        </div>
                    ))}
                </div>
            );
        }

        case "menu_items":
            return <MenuDisplay items={Array.isArray(value) ? value : []} />;

        case "json": {
            const obj = typeof value === "string" ? JSON.parse(value) : value;
            if (typeof obj !== "object") return <span className="text-foreground">{String(obj)}</span>;
            return (
                <dl className="space-y-1.5">
                    {Object.entries(obj).map(([k, v]) => (
                        <div key={k} className="flex gap-2 text-sm">
                            <dt className="font-medium text-muted-foreground capitalize min-w-0 shrink-0">{k.replace(/_/g, " ")}:</dt>
                            <dd className="text-foreground">{String(v)}</dd>
                        </div>
                    ))}
                </dl>
            );
        }

        default:
            return <span className="text-foreground">{String(value)}</span>;
    }
}

export default function DynamicFields({ fieldValues, categoryName }: DynamicFieldsProps) {
    if (!fieldValues || fieldValues.length === 0) return null;

    // Filter out empty values
    const nonEmpty = fieldValues.filter((fv) => {
        const v = fv.value;
        return v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0);
    });

    if (nonEmpty.length === 0) return null;

    return (
        <div className="space-y-4">
            {categoryName && (
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {categoryName}-specific Details
                </h3>
            )}
            <div className="space-y-4">
                {nonEmpty.map((fv) => (
                    <div key={fv.id} className="rounded-xl border border-border bg-muted/20 p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {fv.category_fields.field_label}
                        </p>
                        <FieldRenderer
                            type={fv.category_fields.field_type}
                            value={fv.value}
                            options={fv.category_fields.options}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
