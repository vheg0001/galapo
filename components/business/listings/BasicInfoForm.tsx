"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — BasicInfoForm Component (Module 9.1)
// ──────────────────────────────────────────────────────────

import { useListingFormStore } from "@/store/listingFormStore";
import RichTextEditor from "./RichTextEditor";
import TagInput from "./TagInput";

export default function BasicInfoForm() {
    const { formData, updateFormData, errors } = useListingFormStore();

    return (
        <div className="mx-auto max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>
                <p className="text-sm text-gray-500">Provide the essential details about your business.</p>
            </div>

            <div className="space-y-6">
                {/* Business Name */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">
                        Business Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Olongapo Grand Hotel"
                        value={formData.business_name}
                        onChange={(e) => updateFormData({ business_name: e.target.value })}
                        className={`w-full rounded-xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 ${errors.business_name ? "border-red-300 bg-red-50 focus:border-red-500" : "border-gray-200 focus:border-[#FF6B35]"
                            }`}
                    />
                    {errors.business_name && <p className="text-xs font-medium text-red-500">{errors.business_name}</p>}
                </div>

                {/* Short Description */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">
                        Short Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        placeholder="A brief summary of your business (max 160 characters)"
                        value={formData.short_description}
                        onChange={(e) => updateFormData({ short_description: e.target.value })}
                        className={`w-full rounded-xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 h-24 resize-none ${errors.short_description ? "border-red-300 bg-red-50 focus:border-red-500" : "border-gray-200 focus:border-[#FF6B35]"
                            }`}
                    />
                    <div className="flex justify-between items-center px-1">
                        {errors.short_description && <p className="text-xs font-medium text-red-500">{errors.short_description}</p>}
                        <p className={`ml-auto text-[10px] font-medium ${formData.short_description.length > 160 ? "text-red-500" : "text-gray-400"}`}>
                            {formData.short_description.length} / 160
                        </p>
                    </div>
                </div>

                {/* Full Description */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Full Description</label>
                    <RichTextEditor
                        value={formData.full_description || ""}
                        onChange={(html) => updateFormData({ full_description: html })}
                        placeholder="Tell customers what makes your business special..."
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Contact Phone */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700">
                            Contact Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            placeholder="e.g. 0912 345 6789"
                            value={formData.phone || ""}
                            onChange={(e) => updateFormData({ phone: e.target.value })}
                            className={`w-full rounded-xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 ${errors.phone ? "border-red-300 bg-red-50 focus:border-red-500" : "border-gray-200 focus:border-[#FF6B35]"
                                }`}
                        />
                        {errors.phone && <p className="text-xs font-medium text-red-500">{errors.phone}</p>}
                    </div>

                    {/* Contact Email */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700">Contact Email</label>
                        <input
                            type="email"
                            placeholder="e.g. hello@business.com"
                            value={formData.email || ""}
                            onChange={(e) => updateFormData({ email: e.target.value })}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                        />
                    </div>
                </div>

                {/* Website */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Website URL</label>
                    <input
                        type="url"
                        placeholder="https://www.yourbusiness.com"
                        value={formData.website || ""}
                        onChange={(e) => updateFormData({ website: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                    />
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Tags / Keywords</label>
                    <TagInput
                        tags={formData.tags || []}
                        onChange={(tags) => updateFormData({ tags })}
                        placeholder="Add keywords to help people find you (e.g. swimming pool, wifi)"
                    />
                    <p className="text-[10px] text-gray-400">Separate keywords with Enter key.</p>
                </div>
            </div>
        </div>
    );
}
