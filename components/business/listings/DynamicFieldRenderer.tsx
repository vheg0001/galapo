"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — DynamicFieldRenderer Component (Module 9.1)
// Premium-styled dynamic field renderer matching the admin form aesthetic.
// ──────────────────────────────────────────────────────────

import { FieldType, CategoryField } from "@/lib/types";
import MenuItemBuilder from "./MenuItemBuilder";
import { Camera, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface DynamicFieldRendererProps {
    field: CategoryField;
    value: any;
    onChange: (value: any) => void;
}

const INPUT_CLS = "w-full rounded-2xl border border-border/60 bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-all focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/10 shadow-sm";
const LABEL_CLS = "text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1";

export default function DynamicFieldRenderer({ field, value, onChange }: DynamicFieldRendererProps) {
    const label = (
        <label className={LABEL_CLS}>
            {field.field_label}
            {field.is_required && <span className="text-destructive ml-1">*</span>}
        </label>
    );

    const helpText = field.help_text && (
        <p className="mt-1.5 text-[10px] font-medium text-muted-foreground/50 ml-1">{field.help_text}</p>
    );

    switch (field.field_type) {
        case FieldType.TEXT:
        case FieldType.URL:
        case FieldType.PHONE:
        case FieldType.EMAIL:
            return (
                <div className="space-y-2">
                    {label}
                    <input
                        type={field.field_type === FieldType.EMAIL ? "email" : "text"}
                        placeholder={field.placeholder || ""}
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        className={INPUT_CLS}
                    />
                    {helpText}
                </div>
            );

        case FieldType.TEXTAREA:
            return (
                <div className="space-y-2">
                    {label}
                    <textarea
                        placeholder={field.placeholder || ""}
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        rows={4}
                        className={cn(INPUT_CLS, "resize-none")}
                    />
                    {helpText}
                </div>
            );

        case FieldType.NUMBER:
        case FieldType.CURRENCY:
            return (
                <div className="space-y-2">
                    {label}
                    <div className="relative">
                        {field.field_type === FieldType.CURRENCY && (
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-sm font-bold">₱</span>
                        )}
                        <input
                            type="number"
                            placeholder={field.placeholder || ""}
                            value={value || ""}
                            onChange={(e) => onChange(e.target.value)}
                            className={cn(INPUT_CLS, field.field_type === FieldType.CURRENCY ? "pl-8" : "")}
                        />
                    </div>
                    {helpText}
                </div>
            );

        case FieldType.BOOLEAN:
            return (
                <div className="flex items-center justify-between gap-4 py-3 px-4 rounded-2xl border border-border/50 bg-background/50 shadow-sm transition hover:bg-muted/5">
                    <div className="flex-1">
                        <p className="text-sm font-bold text-foreground">
                            {field.field_label}
                            {field.is_required && <span className="text-destructive ml-1">*</span>}
                        </p>
                        {field.help_text && (
                            <p className="text-[10px] font-medium text-muted-foreground/50 mt-0.5">{field.help_text}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => onChange(!value)}
                        className={cn(
                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20",
                            value ? "bg-[#FF6B35]" : "bg-muted"
                        )}
                    >
                        <span
                            className={cn(
                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                                value ? "translate-x-5" : "translate-x-0"
                            )}
                        />
                    </button>
                </div>
            );

        case FieldType.SELECT:
        case FieldType.MULTI_SELECT:
            const normalizedOptions = (field.options || []).map((opt: any) => {
                if (typeof opt === "string") {
                    return { value: opt, label: opt };
                }
                return opt;
            });

            if (field.field_type === FieldType.SELECT) {
                return (
                    <div className="space-y-2">
                        {label}
                        <select
                            value={value || ""}
                            onChange={(e) => onChange(e.target.value)}
                            className={cn(INPUT_CLS, "appearance-none")}
                        >
                            <option value="">Select option...</option>
                            {normalizedOptions.map((opt: any) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {helpText}
                    </div>
                );
            }

            const currentValues = Array.isArray(value) ? value : [];
            const toggleValue = (val: string) => {
                if (currentValues.includes(val)) {
                    onChange(currentValues.filter((v: string) => v !== val));
                } else {
                    onChange([...currentValues, val]);
                }
            };
            return (
                <div className="space-y-2">
                    {label}
                    <div className="flex flex-wrap gap-2 p-3 rounded-2xl border border-border/50 bg-muted/10">
                        {normalizedOptions.map((opt: any) => {
                            const selected = currentValues.includes(opt.value);
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => toggleValue(opt.value)}
                                    className={cn(
                                        "rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm",
                                        selected
                                            ? "border-[#FF6B35]/50 bg-[#FF6B35]/10 text-[#FF6B35]"
                                            : "border-border/60 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                    {helpText}
                </div>
            );

        case FieldType.IMAGE_GALLERY:
            const images = Array.isArray(value) ? value : [];
            const addImage = () => {
                onChange([...images, ""]);
            };
            return (
                <div className="space-y-2">
                    {label}
                    <div className="flex flex-wrap gap-3 p-3 rounded-2xl border border-border/50 bg-muted/10">
                        {images.map((img: string, idx: number) => (
                            <div key={idx} className="relative h-20 w-20 rounded-xl bg-muted border border-border/50 overflow-hidden">
                                {img ? (
                                    <img src={img} className="h-full w-full object-cover" alt="" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center">
                                        <Camera size={16} className="text-muted-foreground/30" />
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => onChange(images.filter((_, i) => i !== idx))}
                                    className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-0.5 text-white shadow-sm"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        ))}
                        {images.length < 5 && (
                            <button
                                type="button"
                                onClick={addImage}
                                className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-border/50 text-muted-foreground/40 hover:border-primary/40 hover:text-primary/50 transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        )}
                    </div>
                    {helpText}
                </div>
            );

        case FieldType.MENU_ITEMS:
            return (
                <div className="space-y-2">
                    {label}
                    <MenuItemBuilder items={value || []} onChange={onChange} />
                    {helpText}
                </div>
            );

        default:
            return (
                <div className="text-xs font-bold text-amber-600 bg-amber-50 rounded-xl px-3 py-2 border border-amber-200/50">
                    Field type "{field.field_type}" is not yet implemented.
                </div>
            );
    }
}
