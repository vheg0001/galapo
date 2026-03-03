"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — DynamicFieldRenderer Component (Module 9.1)
// ──────────────────────────────────────────────────────────

import { FieldType } from "@/lib/types";
import MenuItemBuilder from "./MenuItemBuilder";
import { Camera, X, Plus } from "lucide-react";

interface DynamicFieldRendererProps {
    field: {
        id: string;
        field_label: string;
        field_type: FieldType;
        is_required: boolean;
        placeholder?: string;
        help_text?: string;
        options?: any;
    };
    value: any;
    onChange: (value: any) => void;
}

export default function DynamicFieldRenderer({ field, value, onChange }: DynamicFieldRendererProps) {
    const label = (
        <label className="block text-sm font-semibold text-gray-700 mb-1">
            {field.field_label}
            {field.is_required && <span className="text-red-500 ml-1">*</span>}
        </label>
    );

    const helpText = field.help_text && (
        <p className="mt-1.5 text-xs text-gray-400">{field.help_text}</p>
    );

    switch (field.field_type) {
        case FieldType.TEXT:
        case FieldType.URL:
        case FieldType.PHONE:
        case FieldType.EMAIL:
            return (
                <div>
                    {label}
                    <input
                        type={field.field_type === FieldType.EMAIL ? "email" : "text"}
                        placeholder={field.placeholder || ""}
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm transition focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/20"
                    />
                    {helpText}
                </div>
            );

        case FieldType.TEXTAREA:
            return (
                <div>
                    {label}
                    <textarea
                        placeholder={field.placeholder || ""}
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        rows={4}
                        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm transition focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/20"
                    />
                    {helpText}
                </div>
            );

        case FieldType.NUMBER:
        case FieldType.CURRENCY:
            return (
                <div>
                    {label}
                    <div className="relative">
                        {field.field_type === FieldType.CURRENCY && (
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₱</span>
                        )}
                        <input
                            type="number"
                            placeholder={field.placeholder || ""}
                            value={value || ""}
                            onChange={(e) => onChange(e.target.value)}
                            className={`w-full rounded-lg border border-gray-200 py-2.5 text-sm transition focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/20 ${field.field_type === FieldType.CURRENCY ? "pl-8 pr-4" : "px-4"
                                }`}
                        />
                    </div>
                    {helpText}
                </div>
            );

        case FieldType.BOOLEAN:
            return (
                <div className="flex items-center justify-between py-1">
                    <div>
                        {label}
                        {helpText}
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                        <input
                            type="checkbox"
                            checked={!!value}
                            onChange={(e) => onChange(e.target.checked)}
                            className="sr-only"
                        />
                        <div className={`h-6 w-11 rounded-full bg-gray-200 transition-colors ${value ? "bg-[#FF6B35]" : "bg-gray-200"}`}>
                            <div className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${value ? "translate-x-5" : "translate-x-0"}`} />
                        </div>
                    </label>
                </div>
            );

        case FieldType.SELECT:
            return (
                <div>
                    {label}
                    <select
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm transition focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/20 bg-white"
                    >
                        <option value="">Select option...</option>
                        {field.options?.map((opt: any) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    {helpText}
                </div>
            );

        case FieldType.MULTI_SELECT:
            const currentValues = Array.isArray(value) ? value : [];
            const toggleValue = (val: string) => {
                if (currentValues.includes(val)) {
                    onChange(currentValues.filter((v: string) => v !== val));
                } else {
                    onChange([...currentValues, val]);
                }
            };
            return (
                <div>
                    {label}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {field.options?.map((opt: any) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => toggleValue(opt.value)}
                                className={`flex items-center justify-center rounded-lg border py-2 text-xs font-medium transition ${currentValues.includes(opt.value)
                                        ? "border-[#FF6B35] bg-[#FF6B35]/5 text-[#FF6B35]"
                                        : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200"
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    {helpText}
                </div>
            );

        case FieldType.IMAGE_GALLERY:
            const images = Array.isArray(value) ? value : [];
            const addImage = () => {
                // Simplified: just add a placeholder or trigger upload
                onChange([...images, ""]);
            };
            return (
                <div>
                    {label}
                    <div className="flex flex-wrap gap-3">
                        {images.map((img: string, idx: number) => (
                            <div key={idx} className="relative h-20 w-20 rounded-lg bg-gray-100 border border-gray-200">
                                {img ? (
                                    <img src={img} className="h-full w-full object-cover rounded-lg" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center"><Camera size={16} className="text-gray-300" /></div>
                                )}
                                <button
                                    onClick={() => onChange(images.filter((_, i) => i !== idx))}
                                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-0.5 text-white shadow-sm"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        ))}
                        {images.length < 5 && (
                            <button
                                type="button"
                                onClick={addImage}
                                className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-gray-300 hover:border-gray-300 hover:text-gray-400"
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
                <div>
                    {label}
                    <MenuItemBuilder items={value || []} onChange={onChange} />
                    {helpText}
                </div>
            );

        default:
            return (
                <div className="text-xs text-amber-600">
                    Field type "{field.field_type}" not implemented yet.
                </div>
            );
    }
}
