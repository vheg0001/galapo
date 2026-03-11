"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, CheckCircle2, ImagePlus, Loader2, Sparkles } from "lucide-react";
import RichTextEditor from "@/components/admin/pages/RichTextEditor";
import ListingSearchSelect from "@/components/business/deals/ListingSearchSelect";
import EventCard from "@/components/shared/EventCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadEventBanner } from "@/lib/supabase-storage";
import { cn } from "@/lib/utils";

interface ListingOption {
    id: string;
    business_name: string;
    address?: string | null;
    slug?: string;
    is_featured?: boolean;
    is_premium?: boolean;
}

interface EventFormProps {
    listings: ListingOption[];
    initialData?: any;
    isEditing?: boolean;
    adminMode?: boolean;
}

function todayString() {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

export default function EventForm({ listings, initialData, isEditing = false, adminMode = false }: EventFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.image_url || null);

    const [formData, setFormData] = useState({
        listing_id: initialData?.listing_id || "",
        title: initialData?.title || "",
        description: initialData?.description || "",
        event_date: initialData?.event_date ? initialData.event_date.split("T")[0] : todayString(),
        start_time: initialData?.start_time || "",
        end_time: initialData?.end_time || "",
        venue: initialData?.venue || "",
        venue_address: initialData?.venue_address || "",
        image_url: initialData?.image_url || "",
        is_featured: initialData?.is_featured ?? adminMode,
        is_city_wide: initialData?.is_city_wide ?? adminMode,
    });
    const [sameAsBusiness, setSameAsBusiness] = useState(false);

    const selectedListing = useMemo(
        () => listings.find((listing) => listing.id === formData.listing_id),
        [formData.listing_id, listings]
    );

    const canRequestFeatured = adminMode || Boolean(selectedListing?.is_featured || selectedListing?.is_premium);

    useEffect(() => {
        if (sameAsBusiness && selectedListing) {
            setFormData((current) => ({
                ...current,
                venue: selectedListing.business_name,
                venue_address: selectedListing.address || current.venue_address,
            }));
        }
    }, [sameAsBusiness, selectedListing]);

    useEffect(() => {
        if (!canRequestFeatured && !adminMode) {
            setFormData((current) => ({ ...current, is_featured: false }));
        }
    }, [adminMode, canRequestFeatured]);

    useEffect(() => {
        if (formData.is_city_wide && adminMode) {
            setFormData((current) => ({
                ...current,
                listing_id: "",
                is_featured: current.is_featured ?? true,
            }));
        }
    }, [adminMode, formData.is_city_wide]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError("Image size must be 5MB or less.");
            return;
        }
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let imageUrl = formData.image_url;
            if (selectedFile) {
                const upload = await uploadEventBanner(selectedFile, formData.listing_id || "city-wide");
                imageUrl = upload.publicUrl;
            }

            const endpoint = adminMode ? "/api/admin/events" : "/api/business/events";
            const url = isEditing ? `${endpoint}/${initialData.id}` : endpoint;
            const method = isEditing ? (adminMode ? "PUT" : "PUT") : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    image_url: imageUrl,
                    listing_id: formData.is_city_wide ? null : formData.listing_id,
                    is_featured: adminMode ? formData.is_featured : canRequestFeatured && formData.is_featured,
                    is_city_wide: adminMode ? formData.is_city_wide : false,
                }),
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || "Failed to save event.");
            }

            router.push(adminMode ? "/admin/events" : "/business/events");
            router.refresh();
        } catch (submitError: any) {
            setError(submitError.message || "Failed to save event.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="rounded-[2.5rem] border border-border bg-card p-8 shadow-sm md:p-10">
                    <div className="mb-8 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <CalendarDays className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-foreground">
                                {isEditing ? "Edit Event" : adminMode ? "Create Event" : "Create New Event"}
                            </h2>
                            <p className="text-sm text-muted-foreground">Share upcoming happenings with the GalaPo audience.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {adminMode && (
                            <label className="flex items-center justify-between rounded-2xl border border-border bg-background px-5 py-4">
                                <div>
                                    <p className="text-sm font-bold text-foreground">City-Wide Event</p>
                                    <p className="text-xs text-muted-foreground">Enable this for festivals, holidays, and community-wide happenings.</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={formData.is_city_wide}
                                    onChange={(e) => setFormData((current) => ({ ...current, is_city_wide: e.target.checked }))}
                                    className="h-5 w-5 accent-primary"
                                />
                            </label>
                        )}

                        {(!adminMode || !formData.is_city_wide) && (
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Listing</Label>
                                <ListingSearchSelect
                                    listings={listings as any}
                                    value={formData.listing_id}
                                    onChange={(listingId) => setFormData((current) => ({ ...current, listing_id: listingId }))}
                                    placeholder={adminMode ? "Search for a listing..." : "Choose your listing..."}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Title</Label>
                                <span className="text-[11px] font-bold text-muted-foreground">{formData.title.length}/200</span>
                            </div>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData((current) => ({ ...current, title: e.target.value.slice(0, 200) }))}
                                placeholder="e.g. Grand Opening Weekend"
                                required
                                maxLength={200}
                                className="h-12 rounded-2xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Description</Label>
                            <RichTextEditor
                                value={formData.description}
                                onChange={(value) => setFormData((current) => ({ ...current, description: value }))}
                                placeholder="Describe the event, activities, performers, or special offers..."
                                minHeight="260px"
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Event Date</Label>
                                <Input
                                    type="date"
                                    min={isEditing ? undefined : todayString()}
                                    value={formData.event_date}
                                    onChange={(e) => setFormData((current) => ({ ...current, event_date: e.target.value }))}
                                    required
                                    className="h-12 rounded-2xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Start Time</Label>
                                <Input
                                    type="time"
                                    value={formData.start_time}
                                    onChange={(e) => setFormData((current) => ({ ...current, start_time: e.target.value }))}
                                    required
                                    className="h-12 rounded-2xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">End Time</Label>
                                <Input
                                    type="time"
                                    value={formData.end_time}
                                    onChange={(e) => setFormData((current) => ({ ...current, end_time: e.target.value }))}
                                    className="h-12 rounded-2xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Venue</Label>
                                {selectedListing && (
                                    <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                        <input
                                            type="checkbox"
                                            checked={sameAsBusiness}
                                            onChange={(e) => setSameAsBusiness(e.target.checked)}
                                            className="h-4 w-4 accent-primary"
                                        />
                                        Same as business address
                                    </label>
                                )}
                            </div>
                            <Input
                                value={formData.venue}
                                onChange={(e) => setFormData((current) => ({ ...current, venue: e.target.value.slice(0, 200) }))}
                                placeholder="Venue name"
                                required
                                className="h-12 rounded-2xl"
                            />
                            <Input
                                value={formData.venue_address}
                                onChange={(e) => setFormData((current) => ({ ...current, venue_address: e.target.value }))}
                                placeholder="Venue address"
                                required
                                className="h-12 rounded-2xl"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Event Image</Label>
                            <label className="flex cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-border bg-background px-6 py-10 text-center transition hover:bg-muted/40">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Event preview" className="mb-4 aspect-[16/9] w-full max-w-xl rounded-[1.5rem] object-cover" />
                                ) : (
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <ImagePlus className="h-6 w-6" />
                                    </div>
                                )}
                                <span className="text-sm font-bold text-foreground">Upload 16:9 event image</span>
                                <span className="mt-1 text-xs text-muted-foreground">JPEG, PNG, or WEBP • up to 5MB</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </label>
                        </div>

                        <label className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-background px-5 py-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-secondary" />
                                    <p className="text-sm font-bold text-foreground">{adminMode ? "Featured Event" : "Request Featured Event"}</p>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Featured events appear on the homepage. This is a premium feature.
                                </p>
                                {!canRequestFeatured && !adminMode && (
                                    <p className="mt-2 text-xs font-bold text-secondary">Upgrade to get featured events.</p>
                                )}
                            </div>
                            <input
                                type="checkbox"
                                checked={formData.is_featured}
                                disabled={!canRequestFeatured && !adminMode}
                                onChange={(e) => setFormData((current) => ({ ...current, is_featured: e.target.checked }))}
                                className="mt-1 h-5 w-5 accent-primary disabled:opacity-50"
                            />
                        </label>
                    </div>

                    {error && (
                        <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="mt-8 flex flex-wrap items-center gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-primary-foreground shadow-lg shadow-primary/15 transition hover:bg-primary/90 disabled:opacity-60"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            {isEditing ? "Update Event" : "Publish Event"}
                        </button>
                        <Link
                            href={adminMode ? "/admin/events" : "/business/events"}
                            className="inline-flex items-center rounded-2xl border border-border bg-background px-6 py-3 text-sm font-bold text-foreground transition hover:bg-muted"
                        >
                            Cancel
                        </Link>
                    </div>
                </div>
            </form>

            <div className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-muted-foreground">Live Preview</p>
                <EventCard
                    slug={initialData?.slug || "preview"}
                    title={formData.title || "Your event title"}
                    description={formData.description || "Describe your event and what attendees can expect."}
                    imageUrl={previewUrl || undefined}
                    eventDate={formData.event_date || todayString()}
                    startTime={formData.start_time || ""}
                    endTime={formData.end_time || ""}
                    venue={formData.venue || selectedListing?.business_name || "Venue"}
                    venueAddress={formData.venue_address || selectedListing?.address || "Olongapo City"}
                    isCityWide={adminMode ? formData.is_city_wide : false}
                    isFeatured={formData.is_featured}
                    listing={!adminMode || !formData.is_city_wide ? selectedListing ? {
                        businessName: selectedListing.business_name,
                        slug: selectedListing.slug || selectedListing.id,
                        isFeatured: selectedListing.is_featured,
                        isPremium: selectedListing.is_premium,
                    } : null : null}
                />
            </div>
        </div>
    );
}