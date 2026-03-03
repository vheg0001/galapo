"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — ReviewStep Component (Module 9.1)
// ──────────────────────────────────────────────────────────

import { useListingFormStore } from "@/store/listingFormStore";
import { CheckCircle2, MapPin, Phone, Globe, Mail, ShieldCheck } from "lucide-react";

export default function ReviewStep() {
    const { formData, editingListingId } = useListingFormStore();
    const isEditMode = editingListingId !== null;

    const Section = ({ title, children, icon: Icon }: any) => (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <Icon size={18} className="text-[#FF6B35]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">{title}</h3>
            </div>
            {children}
        </div>
    );

    return (
        <div className="mx-auto max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold text-gray-900">Review Your Listing</h2>
                <p className="text-sm text-gray-500">Please double check everything before submitting.</p>
            </div>

            {isEditMode && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 flex gap-3 text-amber-800">
                    <ShieldCheck className="shrink-0" size={20} />
                    <div className="text-xs">
                        <p className="font-bold">Important Note on Edits</p>
                        <p className="mt-1 leading-relaxed opacity-90">
                            Changing critical fields (Name, Category, Location) will require your listing to be re-approved by our team before the changes appear live.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {/* Visual Identity */}
                <Section title="Identity" icon={CheckCircle2}>
                    <div className="flex items-start gap-4">
                        {(formData.logo_preview || formData.logo_existing_url) ? (
                            <img
                                src={formData.logo_preview || formData.logo_existing_url}
                                className="h-16 w-16 rounded-xl object-contain border border-gray-100 bg-white p-2"
                                alt="Logo Preview"
                            />
                        ) : (
                            <div className="h-16 w-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300">No Logo</div>
                        )}
                        <div>
                            <h4 className="text-xl font-bold text-gray-900">{formData.business_name || "Business Name Missing"}</h4>
                            <p className="text-xs font-medium text-[#FF6B35] bg-[#FF6B35]/5 px-2 py-0.5 rounded-full inline-block mt-1">
                                {formData.category_id ? "Category Selected" : "Category Missing"}
                            </p>
                        </div>
                    </div>
                </Section>

                {/* Contact & Location */}
                <Section title="Contact & Location" icon={MapPin}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-start gap-3">
                            <MapPin size={16} className="mt-0.5 shrink-0 text-gray-400" />
                            <span>{formData.address || "Address missing"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone size={16} className="shrink-0 text-gray-400" />
                            <span>{formData.phone || "Phone missing"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail size={16} className="shrink-0 text-gray-400" />
                            <span className="truncate">{formData.email || "Email missing"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Globe size={16} className="shrink-0 text-gray-400" />
                            <span className="truncate">{formData.website || "No website"}</span>
                        </div>
                    </div>
                </Section>

                {/* Description & Tags */}
                <Section title="Description & Details" icon={ShieldCheck}>
                    <div
                        className="text-xs text-gray-600 prose prose-sm max-w-none line-clamp-3 mb-4"
                        dangerouslySetInnerHTML={{ __html: formData.full_description || "<i>No description provided</i>" }}
                    />
                    <div className="flex flex-wrap gap-2">
                        {formData.tags?.map(tag => (
                            <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">{tag}</span>
                        ))}
                    </div>
                </Section>

                {/* Photo Count */}
                <Section title="Media" icon={CheckCircle2}>
                    <p className="text-sm text-gray-600">
                        <span className="font-bold text-gray-900">{formData.photos?.length || 0}</span> photos uploaded to your gallery.
                    </p>
                </Section>
            </div>
        </div>
    );
}
