"use client";

import { useState, useEffect, useRef } from "react";

import { Building2, MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter, Youtube, Clock, Info, Sparkles, Image as ImageIcon, Send, ShieldCheck, CheckCircle2, XCircle, LayoutGrid, Eye, EyeOff, MessageSquare } from "lucide-react";
import { cn, formatPhoneNumberInput } from "@/lib/utils";
import MapPinSelector from "@/components/business/listings/MapPinSelector";
import OperatingHoursEditor from "@/components/business/listings/OperatingHoursEditor";
import DynamicFieldsForm from "@/components/business/listings/DynamicFieldsForm";
import LogoUploader from "@/components/business/listings/LogoUploader";
import PhotoUploader from "@/components/business/listings/PhotoUploader";

interface AdminListingFormProps {
    mode: "create" | "edit";
    listingId?: string;
}

interface AdminPhotoItem {
    id: string;
    url: string;
    isPrimary?: boolean;
    file?: File;
}

const EMPTY_FORM = {
    business_name: "",
    short_description: "",
    full_description: "",
    address: "",
    phone: "",
    phone_secondary: "",
    email: "",
    website: "",
    logo_url: "",
    lat: null as number | null,
    lng: null as number | null,
    social_links: {
        facebook: "",
        instagram: "",
        twitter: "",
        tiktok: "",
        youtube: "",
    },
    payment_methods: [] as string[],
    operating_hours: {
        monday: { open: "08:00", close: "17:00", closed: false },
        tuesday: { open: "08:00", close: "17:00", closed: false },
        wednesday: { open: "08:00", close: "17:00", closed: false },
        thursday: { open: "08:00", close: "17:00", closed: false },
        friday: { open: "08:00", close: "17:00", closed: false },
        saturday: { open: "08:00", close: "17:00", closed: true },
        sunday: { open: "08:00", close: "17:00", closed: true },
    },
    dynamic_fields: {} as Record<string, any>,
    image_urls: [] as string[],
    category_id: "",
    subcategory_id: "",
    barangay_id: "",
    owner_id: "",
    status: "approved",
    is_featured: false,
    is_premium: false,
    is_active: true,
};

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

function normalizeText(value: string) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function matchBarangayId(barangays: any[], rawCandidate: string | null | undefined) {
    if (!rawCandidate) return "";
    const candidate = normalizeText(rawCandidate);
    if (!candidate) return "";

    const exact = barangays.find((b: any) => normalizeText(String(b?.name ?? "")) === candidate);
    if (exact) return exact.id;

    const partial = barangays.find((b: any) => {
        const name = normalizeText(String(b?.name ?? ""));
        return name.includes(candidate) || candidate.includes(name);
    });
    return partial?.id ?? "";
}

function normalizeDescriptionInput(value: unknown) {
    if (value === null || value === undefined) return "";
    const raw = String(value);
    if (!raw.trim()) return "";

    const withLineBreaks = raw
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n")
        .replace(/<\/li>/gi, "\n");

    const withoutTags = withLineBreaks.replace(/<[^>]*>/g, "");
    const decoded = withoutTags
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, "\"")
        .replace(/&#39;/gi, "'");

    return decoded.replace(/\n{3,}/g, "\n\n").trim();
}

export default function AdminListingForm({ mode, listingId }: AdminListingFormProps) {
    const [form, setForm] = useState<any>(EMPTY_FORM);
    const [categories, setCategories] = useState<any[]>([]);
    const [subcategories, setSubcategories] = useState<any[]>([]);
    const [barangays, setBarangays] = useState<any[]>([]);
    const [owners, setOwners] = useState<any[]>([]);
    const [ownerSearch, setOwnerSearch] = useState("");
    const [ownerPickerOpen, setOwnerPickerOpen] = useState(false);
    const [adminNote, setAdminNote] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [isResolvingPin, setIsResolvingPin] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [photoItems, setPhotoItems] = useState<AdminPhotoItem[]>([]);
    const ownerPickerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        async function loadMeta() {
            const [catRes, brgyRes, usersRes] = await Promise.all([
                fetch("/api/categories?all=true", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ data: [] })),
                fetch("/api/barangays?all=true", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ data: [] })),
                fetch("/api/admin/users?limit=100", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ users: [] })),
            ]);
            const allCats = catRes.data ?? catRes.categories ?? [];
            const hasNestedSubcategories = allCats.some((c: any) => Array.isArray(c?.subcategories));
            const parentCategories = allCats.filter((c: any) => !c.parent_id);
            const childSubcategories = hasNestedSubcategories
                ? allCats.flatMap((parent: any) =>
                    (parent.subcategories ?? []).map((sub: any) => ({
                        ...sub,
                        parent_id: sub.parent_id ?? parent.id,
                    }))
                )
                : allCats.filter((c: any) => !!c.parent_id);

            setCategories(parentCategories);
            setSubcategories(childSubcategories);
            setBarangays(brgyRes.data ?? brgyRes.barangays ?? []);
            setOwners(usersRes.users ?? []);
        }
        loadMeta();
    }, []);

    useEffect(() => {
        if (mode !== "edit" || !listingId) return;
        async function loadListing() {
            const res = await fetch(`/api/admin/listings/${listingId}`, { cache: "no-store" });
            const json = await res.json();
            if (!json.listing) return;
            const listing = json.listing;
            const dynamicFields = (json.dynamic_field_values ?? []).reduce((acc: Record<string, any>, row: any) => {
                if (row?.field_id) acc[row.field_id] = row.value;
                return acc;
            }, {});
            setForm({
                business_name: listing.business_name ?? "",
                short_description: listing.short_description ?? "",
                full_description: normalizeDescriptionInput(listing.full_description),
                address: listing.address ?? "",
                phone: formatPhoneNumberInput(listing.phone ?? ""),
                phone_secondary: formatPhoneNumberInput(listing.phone_secondary ?? ""),
                email: listing.email ?? "",
                website: listing.website ?? "",
                logo_url: listing.logo_url ?? "",
                lat: listing.lat ?? null,
                lng: listing.lng ?? null,
                social_links: {
                    facebook: listing.social_links?.facebook ?? "",
                    instagram: listing.social_links?.instagram ?? "",
                    twitter: listing.social_links?.twitter ?? listing.social_links?.x ?? "",
                    tiktok: listing.social_links?.tiktok ?? "",
                    youtube: listing.social_links?.youtube ?? "",
                },
                category_id: listing.category_id ?? "",
                subcategory_id: listing.subcategory_id ?? "",
                barangay_id: listing.barangay_id ?? "",
                owner_id: listing.owner_id ?? "",
                status: listing.status ?? "pending",
                is_featured: !!listing.is_featured,
                is_premium: !!listing.is_premium,
                is_active: !!listing.is_active,
                payment_methods: Array.isArray(listing.payment_methods) ? listing.payment_methods : [],
                operating_hours: listing.operating_hours ?? EMPTY_FORM.operating_hours,
                dynamic_fields: dynamicFields,
                image_urls: Array.isArray(json.images) ? json.images.map((img: any) => img.image_url).filter(Boolean) : [],
            });
            const loadedPhotos: AdminPhotoItem[] = Array.isArray(json.images)
                ? json.images
                    .map((img: any, idx: number) => ({
                        id: img.id ?? `${idx}-${img.image_url}`,
                        url: img.image_url,
                        isPrimary: idx === 0,
                    }))
                    .filter((img: AdminPhotoItem) => !!img.url)
                : [];
            setPhotoItems(loadedPhotos);
            setLogoFile(null);
        }
        loadListing();
    }, [mode, listingId]);

    useEffect(() => {
        const selectedOwner = owners.find((o: any) => o.id === form.owner_id);
        if (selectedOwner) {
            setOwnerSearch(selectedOwner.full_name || selectedOwner.email || "");
        } else if (!form.owner_id) {
            setOwnerSearch("No owner (pre-populated)");
        }
    }, [owners, form.owner_id]);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            const target = event.target as Node | null;
            if (!target) return;
            if (ownerPickerRef.current && !ownerPickerRef.current.contains(target)) {
                setOwnerPickerOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    useEffect(() => {
        if (!form.lat || !form.lng || barangays.length === 0) return;

        const controller = new AbortController();
        const timeout = setTimeout(async () => {
            try {
                setIsResolvingPin(true);
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${form.lat}&lon=${form.lng}`,
                    {
                        signal: controller.signal,
                        headers: { Accept: "application/json" },
                    }
                );
                if (!res.ok) return;

                const json = await res.json();
                const addr = json?.address ?? {};

                const barangayCandidate =
                    addr.suburb ||
                    addr.village ||
                    addr.neighbourhood ||
                    addr.city_district ||
                    addr.quarter ||
                    addr.hamlet ||
                    null;
                const matchedBarangayId = matchBarangayId(barangays, barangayCandidate);

                setForm((prev: any) => {
                    const patch: Record<string, any> = {};
                    if (matchedBarangayId && prev.barangay_id !== matchedBarangayId) patch.barangay_id = matchedBarangayId;
                    return Object.keys(patch).length > 0 ? { ...prev, ...patch } : prev;
                });
            } catch (error: any) {
                if (error?.name !== "AbortError") {
                    console.error("Reverse geocoding failed:", error);
                }
            } finally {
                setIsResolvingPin(false);
            }
        }, 500);

        return () => {
            clearTimeout(timeout);
            controller.abort();
        };
    }, [form.lat, form.lng, barangays]);

    async function uploadLogo(targetListingId: string) {
        if (!logoFile) return null;
        const logoForm = new FormData();
        logoForm.append("file", logoFile);
        const logoRes = await fetch(`/api/admin/listings/${targetListingId}/logo`, {
            method: "POST",
            body: logoForm,
        });
        const logoJson = await logoRes.json();
        if (!logoRes.ok) throw new Error(logoJson.error || "Failed to upload logo");
        return logoJson.logo_url as string;
    }

    async function uploadNewPhotos(targetListingId: string) {
        const newPhotos = photoItems.filter((p) => p.file);
        if (newPhotos.length === 0) return [] as string[];

        const photoForm = new FormData();
        newPhotos.forEach((p) => {
            if (p.file) photoForm.append("images", p.file);
        });
        const imagesRes = await fetch(`/api/admin/listings/${targetListingId}/images`, {
            method: "POST",
            body: photoForm,
        });
        const imagesJson = await imagesRes.json();
        if (!imagesRes.ok) throw new Error(imagesJson.error || "Failed to upload images");
        return Array.isArray(imagesJson.image_urls) ? imagesJson.image_urls as string[] : [];
    }

    async function syncDynamicFieldBlobs(targetListingId: string, currentDynamicFields: Record<string, any>) {
        const dynamicFields = { ...currentDynamicFields };
        let changed = false;

        for (const [fieldId, value] of Object.entries(dynamicFields)) {
            // Case 1: Image Gallery (Array of strings starting with blob:)
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
                const newUrls = await Promise.all(value.map(async (v) => {
                    if (typeof v === "string" && v.startsWith("blob:")) {
                        try {
                            const blob = await fetch(v).then(r => r.blob());
                            const syncForm = new FormData();
                            syncForm.append("file", blob, "asset.jpg");

                            const syncRes = await fetch(`/api/business/listings/${targetListingId}/upload-asset`, {
                                method: "POST",
                                body: syncForm
                            });

                            if (syncRes.ok) {
                                const data = await syncRes.json();
                                changed = true;
                                return data.url;
                            }
                        } catch (e) {
                            console.error("Failed to sync dynamic gallery blob:", v, e);
                        }
                    }
                    return v;
                }));
                dynamicFields[fieldId] = newUrls;
            }
            // Case 2: Menu Items (Array of objects with photo_url)
            else if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && "photo_url" in value[0]) {
                const newItems = await Promise.all(value.map(async (item: any) => {
                    if (item.photo_url && item.photo_url.startsWith("blob:")) {
                        try {
                            const blob = await fetch(item.photo_url).then(r => r.blob());
                            const syncForm = new FormData();
                            syncForm.append("file", blob, "menu-item.jpg");

                            const syncRes = await fetch(`/api/business/listings/${targetListingId}/upload-asset`, {
                                method: "POST",
                                body: syncForm
                            });

                            if (syncRes.ok) {
                                const data = await syncRes.json();
                                changed = true;
                                return { ...item, photo_url: data.url };
                            }
                        } catch (e) {
                            console.error("Failed to sync menu item blob:", item.photo_url, e);
                        }
                    }
                    return item;
                }));
                dynamicFields[fieldId] = newItems;
            }
        }

        return { dynamicFields, changed };
    }

    async function save() {
        setSaving(true);
        setMessage("");
        try {
            const baseImageUrls = photoItems.filter((p) => !p.url.startsWith("blob:")).map((p) => p.url);
            const payload = {
                ...form,
                image_urls: baseImageUrls,
            };

            if (mode === "create") {
                const res = await fetch("/api/admin/listings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || "Failed to create listing");

                const createdId = json.data.id as string;
                const uploadedLogoUrl = await uploadLogo(createdId);
                const uploadedNewUrls = await uploadNewPhotos(createdId);

                // Sync dynamic field images (blobs)
                const { dynamicFields: syncedFields, changed: domainsChanged } = await syncDynamicFieldBlobs(createdId, form.dynamic_fields);

                if (uploadedLogoUrl || uploadedNewUrls.length > 0 || domainsChanged) {
                    const finalImageUrls: string[] = [];
                    let uploadedIndex = 0;
                    photoItems.forEach((item) => {
                        if (item.url.startsWith("blob:")) {
                            const uploaded = uploadedNewUrls[uploadedIndex];
                            uploadedIndex += 1;
                            if (uploaded) finalImageUrls.push(uploaded);
                        } else {
                            finalImageUrls.push(item.url);
                        }
                    });
                    await fetch(`/api/admin/listings/${createdId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            logo_url: uploadedLogoUrl ?? form.logo_url ?? null,
                            image_urls: finalImageUrls,
                            dynamic_fields: syncedFields,
                        }),
                    });
                }

                if (adminNote.trim()) {
                    await fetch(`/api/admin/listings/${createdId}/notes`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ note: adminNote.trim() }),
                    });
                }
                window.location.href = `/admin/listings/${createdId}`;
                return;
            }

            const res = await fetch(`/api/admin/listings/${listingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to save listing");

            const targetId = listingId as string;
            const uploadedLogoUrl = await uploadLogo(targetId);
            const uploadedNewUrls = await uploadNewPhotos(targetId);

            // Sync dynamic field images (blobs) - as safeguard
            const { dynamicFields: syncedFields, changed: domainsChanged } = await syncDynamicFieldBlobs(targetId, form.dynamic_fields);

            if (uploadedLogoUrl || uploadedNewUrls.length > 0 || domainsChanged) {
                const finalImageUrls: string[] = [];
                let uploadedIndex = 0;
                photoItems.forEach((item) => {
                    if (item.url.startsWith("blob:")) {
                        const uploaded = uploadedNewUrls[uploadedIndex];
                        uploadedIndex += 1;
                        if (uploaded) finalImageUrls.push(uploaded);
                    } else {
                        finalImageUrls.push(item.url);
                    }
                });
                const patchRes = await fetch(`/api/admin/listings/${targetId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        logo_url: uploadedLogoUrl ?? form.logo_url ?? null,
                        image_urls: finalImageUrls,
                        dynamic_fields: syncedFields,
                    }),
                });
                if (!patchRes.ok) {
                    const patchJson = await patchRes.json().catch(() => ({}));
                    throw new Error(patchJson.error || "Failed to finalize uploaded images");
                }
            }
            if (adminNote.trim()) {
                await fetch(`/api/admin/listings/${listingId}/notes`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ note: adminNote.trim() }),
                });
                setAdminNote("");
            }
            window.alert("Changes saved successfully.");
            window.location.href = "/admin/listings";
        } catch (error: any) {
            setMessage(error.message);
        } finally {
            setSaving(false);
        }
    }

    const filteredSubcats = form.category_id ? subcategories.filter((s) => s.parent_id === form.category_id) : subcategories;
    const filteredOwners = owners.filter((o: any) => {
        const q = ownerSearch.trim().toLowerCase();
        if (!q || ownerSearch === "No owner (pre-populated)") return true;
        const name = String(o.full_name ?? "").toLowerCase();
        const email = String(o.email ?? "").toLowerCase();
        return name.includes(q) || email.includes(q);
    });
    const isFreePlan = !form.is_featured && !form.is_premium;

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            {/* Top Stats/Plan Row (Optional but nice for context) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-border/50 bg-background/40 p-4 shadow-sm backdrop-blur-sm ring-1 ring-border/50 flex items-center gap-4">
                    <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl transition-all shadow-sm",
                        form.status === 'approved' ? "bg-emerald-500/10 text-emerald-600" :
                            form.status === 'rejected' ? "bg-red-500/10 text-red-600" :
                                "bg-amber-500/10 text-amber-600"
                    )}>
                        {form.status === 'approved' ? <CheckCircle2 className="h-6 w-6" /> :
                            form.status === 'rejected' ? <XCircle className="h-6 w-6" /> :
                                <Sparkles className="h-6 w-6" />}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Current Status</p>
                        <p className="text-sm font-bold capitalize">{form.status?.replace('_', ' ') || 'Pending'}</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-border/50 bg-background/40 p-4 shadow-sm backdrop-blur-sm ring-1 ring-border/50 flex items-center gap-4">
                    <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl transition-all shadow-sm",
                        form.is_featured ? "bg-amber-500/10 text-amber-600" :
                            form.is_premium ? "bg-violet-500/10 text-violet-600" :
                                "bg-emerald-500/10 text-emerald-600"
                    )}>
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Subscription</p>
                        <p className="text-sm font-bold">{form.is_featured ? "Featured" : form.is_premium ? "Premium" : "Free Plan"}</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-border/50 bg-background/40 p-4 shadow-sm backdrop-blur-sm ring-1 ring-border/50 flex items-center gap-4">
                    <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl transition-all shadow-sm",
                        form.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-muted/10 text-muted-foreground"
                    )}>
                        {form.is_active ? <Eye className="h-6 w-6" /> : <EyeOff className="h-6 w-6" />}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Visibility</p>
                        <p className="text-sm font-bold">{form.is_active ? "Live & Active" : "Hidden / Inactive"}</p>
                    </div>
                </div>
            </div>

            {/* Business Information Section */}
            <section className="overflow-hidden rounded-[2rem] border border-border/50 bg-background/40 p-8 shadow-sm backdrop-blur-sm ring-1 ring-border/50">
                <div className="mb-8 flex items-center gap-4 border-b border-border/40 pb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                        <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight text-foreground">Business Information</h3>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Core details & categorization</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Business Name</label>
                            <input
                                value={form.business_name}
                                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                                placeholder="e.g. Blue Lagoon Resort"
                                className="h-12 w-full rounded-2xl border border-border/50 bg-background px-4 text-sm font-medium transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Category</label>
                                <select
                                    value={form.category_id}
                                    onChange={(e) => setForm({ ...form, category_id: e.target.value, subcategory_id: "" })}
                                    className="h-12 w-full rounded-2xl border border-border/50 bg-background px-4 text-sm font-medium transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-sm appearance-none"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Subcategory</label>
                                <select
                                    value={form.subcategory_id}
                                    onChange={(e) => setForm({ ...form, subcategory_id: e.target.value })}
                                    className="h-12 w-full rounded-2xl border border-border/50 bg-background px-4 text-sm font-medium transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-sm appearance-none"
                                >
                                    <option value="">Select Subcategory</option>
                                    {filteredSubcats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Owner Assignment</label>
                            <div ref={ownerPickerRef} className="relative">
                                <input
                                    value={ownerSearch}
                                    onFocus={() => setOwnerPickerOpen(true)}
                                    onChange={(e) => {
                                        setOwnerSearch(e.target.value);
                                        setOwnerPickerOpen(true);
                                    }}
                                    placeholder="Search owner email or name..."
                                    className="h-12 w-full rounded-2xl border border-border/50 bg-background pl-11 pr-4 text-sm font-medium transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-sm"
                                />
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />

                                {ownerPickerOpen && (
                                    <div className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-[1.5rem] border border-border bg-background shadow-2xl p-2 animate-in fade-in zoom-in duration-200">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setForm({ ...form, owner_id: "" });
                                                setOwnerSearch("No owner (pre-populated)");
                                                setOwnerPickerOpen(false);
                                            }}
                                            className="w-full rounded-xl border-b border-border/30 px-4 py-3 text-left text-sm font-semibold hover:bg-muted text-primary transition-colors mb-1"
                                        >
                                            No owner (pre-populated)
                                        </button>
                                        {filteredOwners.map((o: any) => (
                                            <button
                                                key={o.id}
                                                type="button"
                                                onClick={() => {
                                                    setForm({ ...form, owner_id: o.id });
                                                    setOwnerSearch(o.full_name || o.email);
                                                    setOwnerPickerOpen(false);
                                                }}
                                                className="w-full rounded-xl px-4 py-3 text-left text-sm hover:bg-muted transition-colors group"
                                            >
                                                <div className="font-bold text-foreground group-hover:text-primary">{o.full_name || "Guest User"}</div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-muted-foreground/80">{o.email || "No email"}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Primary Phone</label>
                                <div className="relative">
                                    <input
                                        id="listing-phone"
                                        name="phone"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: formatPhoneNumberInput(e.target.value) })}
                                        placeholder="09XX XXX XXXX"
                                        className="h-12 w-full rounded-2xl border border-border/50 bg-background pl-11 pr-4 text-sm font-medium transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-sm"
                                    />
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Secondary Phone</label>
                                <div className="relative">
                                    <input
                                        id="listing-phone-secondary"
                                        name="phone_secondary"
                                        value={form.phone_secondary}
                                        onChange={(e) => setForm({ ...form, phone_secondary: formatPhoneNumberInput(e.target.value) })}
                                        placeholder="09XX XXX XXXX"
                                        className="h-12 w-full rounded-2xl border border-border/50 bg-background pl-11 pr-4 text-sm font-medium transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-sm"
                                    />
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Email Address</label>
                                <div className="relative">
                                    <input
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        placeholder="business@email.com"
                                        className="h-12 w-full rounded-2xl border border-border/50 bg-background pl-11 pr-4 text-sm font-medium transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-sm"
                                    />
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Website URL</label>
                                <div className="relative">
                                    <input
                                        value={form.website}
                                        onChange={(e) => setForm({ ...form, website: e.target.value })}
                                        placeholder="https://..."
                                        className="h-12 w-full rounded-2xl border border-border/50 bg-background pl-11 pr-4 text-sm font-medium transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-sm"
                                    />
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Payment Methods</label>
                            <div className="flex flex-wrap gap-2.5 rounded-[1.5rem] border border-border/50 bg-muted/20 p-4">
                                {PAYMENT_METHOD_OPTIONS.map((method) => {
                                    const selected = (form.payment_methods ?? []).includes(method);
                                    return (
                                        <button
                                            key={method}
                                            type="button"
                                            onClick={() =>
                                                setForm({
                                                    ...form,
                                                    payment_methods: selected
                                                        ? (form.payment_methods ?? []).filter((m: string) => m !== method)
                                                        : [...(form.payment_methods ?? []), method],
                                                })
                                            }
                                            className={cn(
                                                "rounded-xl border px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 shadow-sm",
                                                selected
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-border/60 bg-background/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                                            )}
                                        >
                                            {method}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Location Section */}
            <section className="overflow-hidden rounded-[2rem] border border-border/50 bg-background/40 p-8 shadow-sm backdrop-blur-sm ring-1 ring-border/50">
                <div className="mb-8 flex items-center gap-4 border-b border-border/40 pb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-inner">
                        <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight text-foreground">Location Details</h3>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Geo-tagging & physical address</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <div className="relative mb-4 group overflow-hidden rounded-[1.5rem] border border-border/50 shadow-inner ring-1 ring-border/50">
                            <MapPinSelector
                                lat={form.lat}
                                lng={form.lng}
                                onChange={(lat, lng) => setForm({ ...form, lat, lng })}
                            />
                            {isResolvingPin && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
                                    <div className="flex items-center gap-3 rounded-2xl bg-background px-4 py-2 shadow-xl border border-border/50 ring-1 ring-border/50">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Detecting Address...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Barangay</label>
                            <select
                                value={form.barangay_id}
                                onChange={(e) => setForm({ ...form, barangay_id: e.target.value })}
                                className="h-12 w-full rounded-2xl border border-border/50 bg-background px-4 text-sm font-medium transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-sm appearance-none"
                            >
                                <option value="">Select Barangay</option>
                                {barangays.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Street Address</label>
                            <textarea
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                placeholder="House No., Street name..."
                                rows={4}
                                className="w-full rounded-2xl border border-border/50 bg-background p-4 text-sm font-medium transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-sm resize-none"
                            />
                        </div>

                        <div className="rounded-2xl bg-muted/30 p-4 border border-border/30">
                            <p className="text-[10px] leading-relaxed text-muted-foreground italic font-medium">
                                <Info className="h-3 w-3 inline mr-1 -mt-0.5" />
                                Tip: Drag the map pin to auto-populate the barangay field based on geolocation data.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Descriptions & Rich Content */}
            <section className="overflow-hidden rounded-[2rem] border border-border/50 bg-background/40 p-8 shadow-sm backdrop-blur-sm ring-1 ring-border/50">
                <div className="mb-8 flex items-center gap-4 border-b border-border/40 pb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 shadow-inner">
                        <LayoutGrid className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight text-foreground">Descriptions & Info</h3>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Marketing copy & extra data</p>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Short Description</label>
                            <textarea
                                value={form.short_description}
                                onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                                placeholder="A punchy one-liner for search results..."
                                rows={3}
                                className="w-full rounded-2xl border border-border/50 bg-background p-4 text-sm font-medium transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-sm resize-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Full Description</label>
                            <textarea
                                value={form.full_description}
                                onChange={(e) => setForm({ ...form, full_description: e.target.value })}
                                placeholder="Tell the customers everything about your business..."
                                rows={8}
                                className="w-full rounded-2xl border border-border/50 bg-background p-4 text-sm font-medium leading-relaxed transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-sm resize-none"
                            />
                        </div>
                    </div>

                    {/* Dynamic Attributes — full width */}
                    <div className="border-t border-border/40 pt-8 space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-500/60" />
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Dynamic Attributes</label>
                        </div>
                        <div className="rounded-[1.5rem] border border-border/50 bg-muted/10 p-4 shadow-sm">
                            <DynamicFieldsForm
                                categoryId={form.category_id}
                                subcategoryId={form.subcategory_id}
                                values={form.dynamic_fields}
                                onChange={(values) => setForm({ ...form, dynamic_fields: values })}
                                listingId={listingId}
                            />
                            {(Object.keys(form.dynamic_fields ?? {}).length === 0) && !form.category_id && (
                                <p className="text-center text-xs text-muted-foreground/60 italic py-4">
                                    Select a category to see extra attributes.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Operating Hours — full width */}
                    <div className="border-t border-border/40 pt-8 space-y-4">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary/60" />
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Operating Hours</label>
                        </div>
                        <div className="rounded-[1.5rem] border border-border/50 bg-muted/10 p-4 shadow-sm">
                            <OperatingHoursEditor
                                value={form.operating_hours}
                                onChange={(hours) => setForm({ ...form, operating_hours: hours })}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Media Section */}
            <section className="overflow-hidden rounded-[2rem] border border-border/50 bg-background/40 p-8 shadow-sm backdrop-blur-sm ring-1 ring-border/50">
                <div className="mb-8 flex items-center gap-4 border-b border-border/40 pb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 shadow-inner">
                        <Send className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight text-foreground">Social Connectivity</h3>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Links to social platforms</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Facebook</label>
                        <div className="relative">
                            <input
                                value={form.social_links?.facebook ?? ""}
                                onChange={(e) => setForm({ ...form, social_links: { ...(form.social_links ?? {}), facebook: e.target.value } })}
                                placeholder="@username"
                                className="h-11 w-full rounded-xl border border-border/50 bg-background pl-10 pr-3 text-sm font-medium transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
                            />
                            <Facebook className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-600" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Instagram</label>
                        <div className="relative">
                            <input
                                value={form.social_links?.instagram ?? ""}
                                onChange={(e) => setForm({ ...form, social_links: { ...(form.social_links ?? {}), instagram: e.target.value } })}
                                placeholder="@username"
                                className="h-11 w-full rounded-xl border border-border/50 bg-background pl-10 pr-3 text-sm font-medium transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
                            />
                            <Instagram className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-pink-600" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">X (Twitter)</label>
                        <div className="relative">
                            <input
                                value={form.social_links?.twitter ?? ""}
                                onChange={(e) => setForm({ ...form, social_links: { ...(form.social_links ?? {}), twitter: e.target.value } })}
                                placeholder="@username"
                                className="h-11 w-full rounded-xl border border-border/50 bg-background pl-10 pr-3 text-sm font-medium transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
                            />
                            <Twitter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">TikTok</label>
                        <div className="relative">
                            <input
                                value={form.social_links?.tiktok ?? ""}
                                onChange={(e) => setForm({ ...form, social_links: { ...(form.social_links ?? {}), tiktok: e.target.value } })}
                                placeholder="@username"
                                className="h-11 w-full rounded-xl border border-border/50 bg-background pl-10 pr-3 text-sm font-medium transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
                            />
                            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 fill-foreground" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.8.2-.67.33-1.24.87-1.51 1.59-.21.54-.22 1.14-.14 1.73.19.85.73 1.59 1.41 2.11.83.66 1.61 1 2.6 1.05.77-.01 1.56-.15 2.22-.54.66-.41 1.13-1.05 1.34-1.79.16-.62.24-1.25.22-1.89-.02-4.04-.01-8.07-.01-12.11Z" /></svg>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">YouTube</label>
                        <div className="relative">
                            <input
                                value={form.social_links?.youtube ?? ""}
                                onChange={(e) => setForm({ ...form, social_links: { ...(form.social_links ?? {}), youtube: e.target.value } })}
                                placeholder="/@channel"
                                className="h-11 w-full rounded-xl border border-border/50 bg-background pl-10 pr-3 text-sm font-medium transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
                            />
                            <Youtube className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-red-600" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Media Section */}
            <section className="overflow-hidden rounded-[2rem] border border-border/50 bg-background/40 p-8 shadow-sm backdrop-blur-sm ring-1 ring-border/50">
                <div className="mb-8 flex items-center gap-4 border-b border-border/40 pb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 shadow-inner">
                        <ImageIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight text-foreground">Media & Assets</h3>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Upload logo & gallery photos</p>
                    </div>
                </div>

                <div className="space-y-12">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Brand Logo</label>
                        <div className="max-w-md rounded-[1.5rem] border border-border/50 bg-background/50 p-6 shadow-sm">
                            <LogoUploader
                                url={form.logo_url}
                                onChange={(file, url) => {
                                    setLogoFile(file);
                                    setForm({ ...form, logo_url: url ?? "" });
                                }}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Gallery Photos (Up to 10)</label>
                        <div className="rounded-[1.5rem] border border-border/50 bg-background/50 p-6 shadow-sm">
                            <PhotoUploader
                                photos={photoItems}
                                onChange={(photos) => {
                                    const normalized = photos.map((p, idx) => ({ ...p, isPrimary: idx === 0 }));
                                    setPhotoItems(normalized);
                                    setForm({
                                        ...form,
                                        image_urls: normalized.filter((p) => !p.url.startsWith("blob:")).map((p) => p.url),
                                    });
                                }}
                                maxPhotos={10}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Admin Controls Section */}
            <section className="overflow-hidden rounded-[2rem] border border-primary/20 bg-primary/5 p-8 shadow-md ring-1 ring-primary/20">
                <div className="mb-8 flex items-center gap-4 border-b border-primary/10 pb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight text-foreground">Admin Overrides</h3>
                        <p className="text-xs font-semibold uppercase tracking-widest text-primary/60">Visibility, Status & Private Notes</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Publishing Status</label>
                        <div className="relative group">
                            <select
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                                className="h-14 w-full appearance-none rounded-[1.25rem] border border-primary/20 bg-background px-6 pr-12 text-sm font-bold shadow-sm transition-all hover:border-primary/40 focus:ring-4 focus:ring-primary/10 ring-1 ring-primary/5"
                            >
                                <option value="pending">⏳ Pending Review</option>
                                <option value="approved">✅ Approved & Live</option>
                                <option value="rejected">❌ Rejected / Blocked</option>
                                <option value="expired">⌛ Expired</option>
                            </select>
                            <LayoutGrid className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 pointer-events-none transition-transform group-hover:rotate-45" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Subscription Tier</label>
                        <div className="flex h-14 w-full gap-1.5 rounded-[1.25rem] border border-primary/10 bg-muted/40 p-1.5 shadow-inner">
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, is_featured: false, is_premium: false })}
                                className={cn(
                                    "flex flex-1 items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    isFreePlan
                                        ? "bg-emerald-600 text-white shadow-md scale-[1.02] ring-1 ring-emerald-400/20"
                                        : "text-muted-foreground/60 hover:bg-muted hover:text-foreground"
                                )}
                            >
                                Free
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, is_premium: true, is_featured: false })}
                                className={cn(
                                    "flex flex-1 items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    form.is_premium
                                        ? "bg-violet-600 text-white shadow-md scale-[1.02] ring-1 ring-violet-400/20"
                                        : "text-muted-foreground/60 hover:bg-muted hover:text-foreground"
                                )}
                            >
                                Pro
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, is_featured: true, is_premium: false })}
                                className={cn(
                                    "flex flex-1 items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    form.is_featured
                                        ? "bg-amber-500 text-white shadow-md scale-[1.02] ring-1 ring-amber-400/20"
                                        : "text-muted-foreground/60 hover:bg-muted hover:text-foreground"
                                )}
                            >
                                Top
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Visibility State</label>
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, is_active: !form.is_active })}
                            className={cn(
                                "group flex h-14 w-full items-center justify-between rounded-[1.25rem] border-2 px-6 transition-all active:scale-95 shadow-sm",
                                form.is_active
                                    ? "border-emerald-600/30 bg-emerald-100/5 text-emerald-900"
                                    : "border-muted/50 bg-muted/10 text-muted-foreground"
                            )}
                        >
                            <span className="text-xs font-black uppercase tracking-widest">
                                {form.is_active ? "VISIBLE" : "HIDDEN"}
                            </span>
                            <div className={cn(
                                "relative h-7 w-12 rounded-full transition-all duration-300",
                                form.is_active ? "bg-emerald-600 shadow-lg shadow-emerald-600/20" : "bg-muted-foreground/30"
                            )}>
                                <div className={cn(
                                    "absolute top-1.5 h-4 w-4 rounded-full bg-white transition-all shadow-sm duration-300",
                                    form.is_active ? "left-6.5" : "left-1.5"
                                )} />
                            </div>
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-primary/60" />
                        <label className="text-xs font-bold uppercase tracking-widest text-primary/80">Internal Admin Notes</label>
                    </div>
                    <textarea
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Private reason for status change or internal notes..."
                        rows={3}
                        className="w-full rounded-[1.5rem] border border-primary/20 bg-background/50 p-5 text-sm font-medium transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 shadow-inner leading-relaxed"
                    />
                </div>
            </section>

            {message && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-bold uppercase tracking-widest text-center animate-in slide-in-from-bottom duration-300">
                    ⚠️ {message}
                </div>
            )}

            <div className="flex items-center justify-between pt-4 gap-6">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="h-14 px-8 rounded-2xl border border-border/50 text-sm font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95"
                >
                    Discard
                </button>
                <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="flex-1 h-14 rounded-[1.5rem] bg-primary text-primary-foreground text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-50 ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
                >
                    {saving ? (
                        <div className="flex items-center justify-center gap-3">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                            <span>Processing...</span>
                        </div>
                    ) : (
                        mode === "create" ? "Create Listing" : "Save Changes"
                    )}
                </button>
            </div>
        </div>
    );
}
