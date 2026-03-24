"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — BasicInfoForm Component (Module 9.1)
// ──────────────────────────────────────────────────────────

import { useListingFormStore } from "@/store/listingFormStore";
import RichTextEditor from "./RichTextEditor";
import TagInput from "./TagInput";
import { formatPhoneNumberInput } from "@/lib/utils";

const PAYMENT_METHOD_OPTIONS = [
    "Cash",
    "GCash",
    "Maya",
    "Bank Transfer",
    "Credit Card",
    "Debit Card",
    "GrabPay",
    "ShopeePay",
];

export default function BasicInfoForm() {
    const { formData, updateFormData, errors } = useListingFormStore();
    const socialLinks = formData.social_links || { facebook: "", instagram: "", twitter: "", tiktok: "", youtube: "" };

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
                        maxLength={160}
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

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {/* Contact Phone */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700">
                            Contact Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            placeholder="e.g. 0912 345 6789"
                            value={formData.phone || ""}
                            onChange={(e) => updateFormData({ phone: formatPhoneNumberInput(e.target.value) })}
                            className={`w-full rounded-xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 ${errors.phone ? "border-red-300 bg-red-50 focus:border-red-500" : "border-gray-200 focus:border-[#FF6B35]"
                                }`}
                        />
                        {errors.phone && <p className="text-xs font-medium text-red-500">{errors.phone}</p>}
                    </div>

                    {/* Secondary Phone */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700">Secondary Phone</label>
                        <input
                            type="tel"
                            placeholder="e.g. 0998 765 4321"
                            value={formData.phone_secondary || ""}
                            onChange={(e) => updateFormData({ phone_secondary: formatPhoneNumberInput(e.target.value) })}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                        />
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

                {/* Social Links */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Social Links</label>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <input
                            type="url"
                            placeholder="Facebook URL"
                            value={socialLinks.facebook || ""}
                            onChange={(e) =>
                                updateFormData({
                                    social_links: {
                                        ...socialLinks,
                                        facebook: e.target.value,
                                    },
                                })
                            }
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                        />
                        <input
                            type="url"
                            placeholder="Instagram URL"
                            value={socialLinks.instagram || ""}
                            onChange={(e) =>
                                updateFormData({
                                    social_links: {
                                        ...socialLinks,
                                        instagram: e.target.value,
                                    },
                                })
                            }
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                        />
                        <input
                            type="url"
                            placeholder="X (Twitter) URL"
                            value={socialLinks.twitter || ""}
                            onChange={(e) =>
                                updateFormData({
                                    social_links: {
                                        ...socialLinks,
                                        twitter: e.target.value,
                                    },
                                })
                            }
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                        />
                        <input
                            type="url"
                            placeholder="TikTok URL"
                            value={socialLinks.tiktok || ""}
                            onChange={(e) =>
                                updateFormData({
                                    social_links: {
                                        ...socialLinks,
                                        tiktok: e.target.value,
                                    },
                                })
                            }
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                        />
                        <input
                            type="url"
                            placeholder="YouTube URL"
                            value={socialLinks.youtube || ""}
                            onChange={(e) =>
                                updateFormData({
                                    social_links: {
                                        ...socialLinks,
                                        youtube: e.target.value,
                                    },
                                })
                            }
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20"
                        />
                    </div>
                </div>

                {/* Payment methods */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Payment Methods</label>
                    <div className="flex flex-wrap gap-2">
                        {PAYMENT_METHOD_OPTIONS.map((method) => {
                            const selected = (formData.payment_methods || []).includes(method);
                            return (
                                <button
                                    key={method}
                                    type="button"
                                    onClick={() =>
                                        updateFormData({
                                            payment_methods: selected
                                                ? (formData.payment_methods || []).filter((m) => m !== method)
                                                : [...(formData.payment_methods || []), method],
                                        })
                                    }
                                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${selected
                                            ? "border-[#FF6B35] bg-[#FF6B35] text-white"
                                            : "border-gray-200 bg-white text-gray-700"
                                        }`}
                                >
                                    {method}
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-[10px] text-gray-400">Suggested payment methods commonly used in the Philippines.</p>
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
