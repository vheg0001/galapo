"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Calendar,
    ImageIcon,
    Rocket,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import DealCard from "@/components/shared/DealCard";
import ListingSearchSelect from "./ListingSearchSelect";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import DealBannerUploader from "./DealBannerUploader";
import { uploadDealBanner } from "@/lib/supabase-storage";

interface DealFormProps {
    listings: any[];
    initialData?: any;
    isEditing?: boolean;
}

const DISCOUNT_PRESETS = [
    "10% OFF", "20% OFF", "30% OFF", "50% OFF",
    "Buy 1 Get 1", "Free Delivery", "₱100 OFF", "Special Offer"
];

export default function DealForm({ listings, initialData, isEditing = false }: DealFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        listing_id: initialData?.listing_id || (listings.length === 1 ? listings[0].id : ""),
        title: initialData?.title || "",
        description: initialData?.description || "",
        discount_text: initialData?.discount_text || "",
        start_date: initialData?.start_date ? initialData.start_date.split('T')[0] : new Date().toISOString().split('T')[0],
        end_date: initialData?.end_date ? initialData.end_date.split('T')[0] : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        image_url: initialData?.image_url || "",
        terms_conditions: initialData?.terms_conditions || "Valid for dine-in only. Cannot be combined with other promos."
    });

    const currentListing = listings.find(l => l.id === formData.listing_id);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const isAdmin = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");

        try {
            let finalImageUrl = formData.image_url;

            // 1. Upload banner if a new file was selected
            if (selectedFile) {
                const uploadRes = await uploadDealBanner(selectedFile, formData.listing_id);
                finalImageUrl = uploadRes.publicUrl;
            }

            const baseUrl = isAdmin ? "/api/admin/deals" : "/api/business/deals";

            const url = isEditing ? `${baseUrl}/${initialData.id}` : baseUrl;
            const method = isEditing ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    image_url: finalImageUrl
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save deal");

            router.push(isAdmin ? "/admin/deals" : "/business/deals");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Form Side */}
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6 rounded-[2.5rem] border border-border/40 bg-white p-8 shadow-sm lg:p-10">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Rocket className="h-5 w-5" />
                        </div>
                        <h2 className="text-xl font-black tracking-tight text-gray-900">
                            {isEditing ? "Edit Deal" : "Create New Deal"}
                        </h2>
                    </div>

                    <div className="space-y-6">
                        {/* Listing Selection */}
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Target Listing</Label>
                            <ListingSearchSelect
                                listings={listings}
                                value={formData.listing_id}
                                onChange={(id) => setFormData({ ...formData, listing_id: id })}
                                placeholder="Search for a business listing..."
                            />
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Deal Title</Label>
                            <Input
                                required
                                placeholder="e.g. Summer Weekend Sale"
                                value={formData.title}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                                className="rounded-2xl border-gray-100 bg-gray-50/50 h-12 text-sm font-bold focus:bg-white"
                            />
                        </div>

                        {/* Discount Text */}
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Discount / Offer Legend</Label>
                            <Input
                                required
                                placeholder="e.g. 20% OFF"
                                value={formData.discount_text}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, discount_text: e.target.value })}
                                className="rounded-2xl border-gray-100 bg-gray-50/50 h-12 text-sm font-bold focus:bg-white"
                            />
                            <div className="flex flex-wrap gap-2">
                                {DISCOUNT_PRESETS.map(preset => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, discount_text: preset })}
                                        className={cn(
                                            "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all",
                                            formData.discount_text === preset
                                                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                                                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                        )}
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Offer Details</Label>
                            <Textarea
                                required
                                placeholder="Describe your offer in detail to attract customers..."
                                value={formData.description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                                className="min-h-[120px] rounded-2xl border-gray-100 bg-gray-50/50 text-sm font-medium leading-relaxed focus:bg-white"
                            />
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Start Date</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="date"
                                        required
                                        value={formData.start_date}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, start_date: e.target.value })}
                                        className="rounded-2xl border-gray-100 bg-gray-50/50 h-12 pl-11 text-xs font-bold focus:bg-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">End Date</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="date"
                                        required
                                        value={formData.end_date}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, end_date: e.target.value })}
                                        className="rounded-2xl border-gray-100 bg-gray-50/50 h-12 pl-11 text-xs font-bold focus:bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Banner Image Upload */}
                        <DealBannerUploader
                            url={formData.image_url}
                            onChange={(file) => setSelectedFile(file)}
                        />

                        {/* Image URL (Hidden but still useful for manual links if needed) */}
                        <div className="space-y-2 opacity-40 hover:opacity-100 transition-opacity">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Or Image URL</Label>
                            <div className="relative">
                                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="https://example.com/image.jpg"
                                    value={formData.image_url}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, image_url: e.target.value })}
                                    className="rounded-2xl border-gray-100 bg-gray-50/50 h-10 pl-11 text-xs font-medium focus:bg-white"
                                />
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Terms & Conditions</Label>
                            <Textarea
                                placeholder="Specific rules for this offer..."
                                value={formData.terms_conditions}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, terms_conditions: e.target.value })}
                                className="rounded-2xl border-gray-100 bg-gray-50/50 text-xs font-medium italic focus:bg-white"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-2.5xl bg-primary py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <CheckCircle2 className="h-5 w-5" />
                                {isEditing ? "Update Deal" : "Publish Deal"}
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Preview Side */}
            <div className="space-y-8 lg:sticky lg:top-8 lg:h-fit">
                <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Live Preview</h3>
                    <div className="max-w-md mx-auto transform scale-90 origin-top md:scale-100">
                        <DealCard
                            id="preview"
                            listingSlug="preview"
                            title={formData.title || "Your Deal Title"}
                            description={formData.description || "Describe your offer..."}
                            businessName={currentListing?.business_name || "Your Business Name"}
                            discountText={formData.discount_text || "OFFER"}
                            imageUrl={formData.image_url}
                            endDate={formData.end_date}
                            isPremium={currentListing?.is_premium}
                            isFeatured={currentListing?.is_featured}
                        />
                    </div>
                </div>

                <div className="rounded-[2.5rem] bg-amber-50/50 border border-amber-100 p-8 space-y-4">
                    <div className="flex items-center gap-2 text-amber-600">
                        <Info className="h-5 w-5" />
                        <h4 className="text-sm font-bold uppercase tracking-wider">Perfect Deal Tip</h4>
                    </div>
                </div>
            </div>
        </div>
    );
}
