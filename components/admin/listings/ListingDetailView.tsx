"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Building2, Info, Image as ImageIcon, Sparkles, MapPin, Phone, Mail, Globe, ExternalLink } from "lucide-react";

interface ListingDetailViewProps {
    listing: any;
    deals: any[];
    events: any[];
}

function renderValue(val: any, type?: string) {
    if (val === null || val === undefined || val === "") return <span className="text-muted-foreground/50">Not provided</span>;

    switch (type) {
        case "boolean":
            return val ? (
                <span className="text-emerald-600 font-bold uppercase tracking-wider text-[10px]">Yes</span>
            ) : (
                <span className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">No</span>
            );

        case "multi_select": {
            const items = Array.isArray(val) ? val : [val];
            return (
                <div className="flex flex-wrap gap-1 mt-1">
                    {items.map((it: string, i: number) => (
                        <span key={i} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground ring-1 ring-border/50">
                            {it}
                        </span>
                    ))}
                </div>
            );
        }

        case "menu_items": {
            const items = Array.isArray(val) ? val : [];
            if (items.length === 0) return <span className="text-muted-foreground/50 italic">No items</span>;
            return (
                <div className="space-y-1.5 mt-2">
                    {items.map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg bg-background/50 p-2 ring-1 ring-border/30">
                            {item.photo_url && (
                                <img src={item.photo_url} alt="" className="h-8 w-8 shrink-0 rounded-md object-cover" />
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold text-foreground leading-none">{item.name}</p>
                                {item.price && <p className="mt-1 text-[10px] font-medium text-primary">₱{item.price}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        case "image_gallery": {
            const urls = Array.isArray(val) ? val : [val];
            return (
                <div className="flex flex-wrap gap-2 mt-2">
                    {urls.map((url: string, i: number) => (
                        <div key={i} className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border/50">
                            <img src={url} alt="" className="h-full w-full object-cover" />
                        </div>
                    ))}
                </div>
            );
        }

        case "currency":
            return <span className="font-bold text-primary">₱{Number(val).toLocaleString()}</span>;

        case "number":
            return <span className="font-bold">{Number(val).toLocaleString()}</span>;

        default:
            if (typeof val === "object") return <code className="text-[10px] bg-muted p-1 rounded">{JSON.stringify(val)}</code>;
            return <span className="font-medium">{String(val)}</span>;
    }
}

function formatRichText(value: unknown) {
    if (value === null || value === undefined) return "N/A";
    const raw = String(value).trim();
    if (!raw) return "N/A";

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

    const normalized = decoded.replace(/\n{3,}/g, "\n\n").trim();
    return normalized || "N/A";
}

export default function ListingDetailView({ listing, deals, events }: ListingDetailViewProps) {
    return (
        <div className="space-y-6">
            {/* Business Information */}
            <section className="overflow-hidden rounded-[2rem] border border-border/50 bg-background/40 p-6 shadow-sm backdrop-blur-sm ring-1 ring-border/50">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Business Information</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Core details & contact</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <div className="group space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Business Name</label>
                            <p className="text-sm font-semibold text-foreground">{listing.business_name}</p>
                        </div>
                        <div className="group space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Slug</label>
                            <p className="text-sm font-mono font-medium text-primary">/{listing.slug}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="group space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Category</label>
                                <p className="text-sm font-semibold text-foreground">{listing.categories?.name ?? "N/A"}</p>
                            </div>
                            <div className="group space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Subcategory</label>
                                <p className="text-sm font-semibold text-foreground">{listing.subcategory?.name ?? "N/A"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <Phone className="h-4 w-4" />
                            </div>
                            <div className="space-y-0.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Phone</label>
                                <p className="text-sm font-medium">{listing.phone ?? "N/A"}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <Mail className="h-4 w-4" />
                            </div>
                            <div className="space-y-0.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Email</label>
                                <p className="text-sm font-medium">{listing.email ?? "N/A"}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <Globe className="h-4 w-4" />
                            </div>
                            <div className="space-y-0.5 min-w-0 flex-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Website</label>
                                <p className="truncate text-sm font-medium">
                                    {listing.website ? (
                                        <a href={listing.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                            {listing.website}
                                        </a>
                                    ) : "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-4 pt-4 border-t border-border/50">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                            </div>
                            <div className="space-y-0.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Physical Address</label>
                                <p className="text-sm font-medium">{listing.address ?? "N/A"}</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Short Description</label>
                            <p className="rounded-xl bg-muted/30 p-3 text-sm font-medium text-foreground italic ring-1 ring-border/50">
                                "{listing.short_description || "No short description provided."}"
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Full Description</label>
                            <div className="rounded-xl bg-muted/10 p-4 text-sm leading-relaxed text-foreground whitespace-pre-line ring-1 ring-border/50">
                                {formatRichText(listing.full_description)}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Photos & Logo */}
            <section className="overflow-hidden rounded-[2rem] border border-border/50 bg-background/40 p-6 shadow-sm backdrop-blur-sm ring-1 ring-border/50">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                        <ImageIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Media Gallery</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Logo & gallery photos</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-start gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Brand Logo</label>
                        <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-border/50 bg-muted/30 p-1 shadow-inner group">
                            {listing.logo_url ? (
                                <img src={listing.logo_url} alt="Logo" className="h-full w-full rounded-xl object-cover transition-transform group-hover:scale-110" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                                    <Building2 className="h-8 w-8" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 min-w-[300px] space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Gallery Photos ({(listing.images ?? []).length})</label>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {(listing.images ?? []).length === 0 && (
                                <div className="col-span-full py-8 text-center rounded-xl bg-muted/20 border border-dashed border-border">
                                    <p className="text-xs text-muted-foreground">No gallery images uploaded yet.</p>
                                </div>
                            )}
                            {(listing.images ?? []).map((img: any) => (
                                <a
                                    key={img.id}
                                    href={img.image_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative aspect-square overflow-hidden rounded-xl border border-border/50 bg-muted/30 shadow-sm transition-all hover:scale-[1.05] hover:shadow-md"
                                >
                                    <img src={img.image_url} alt={img.alt_text ?? listing.business_name} className="h-full w-full object-cover transition-opacity group-hover:opacity-90" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                        <ExternalLink className="h-5 w-5 text-white" />
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Dynamic Fields */}
            <section className="overflow-hidden rounded-[2rem] border border-border/50 bg-background/40 p-6 shadow-sm backdrop-blur-sm ring-1 ring-border/50">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                        <Info className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Dynamic Fields</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Category specific attributes</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {(listing.field_values ?? []).length === 0 && (
                        <p className="col-span-full py-4 text-center text-sm text-muted-foreground italic">No extra attributes defined for this category.</p>
                    )}
                    {(listing.field_values ?? []).map((fv: any) => (
                        <div key={fv.id} className="rounded-2xl border border-border/50 bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                {fv.category_fields?.field_label ?? fv.category_fields?.field_name ?? "Field"}
                            </label>
                            <div className="text-sm font-semibold text-foreground">
                                {renderValue(fv.value, fv.category_fields?.field_type)}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Deals & Events */}
            <section className="overflow-hidden rounded-[2rem] border border-border/50 bg-background/40 p-6 shadow-sm backdrop-blur-sm ring-1 ring-border/50">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10 text-pink-500">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Marketing & Engagement</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Deals, discounts & upcoming events</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Active Deals</label>
                        {(deals ?? []).length === 0 && (
                            <div className="py-8 text-center rounded-2xl bg-muted/10 border border-dashed border-border/50">
                                <p className="text-xs text-muted-foreground">No active deals found.</p>
                            </div>
                        )}
                        {(deals ?? []).map((d: any) => (
                            <div key={d.id} className="group flex items-center gap-4 rounded-2xl border border-border/50 bg-emerald-500/5 p-4 transition-all hover:bg-emerald-500/10">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                                    <span className="text-sm font-black">%</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold text-foreground">{d.title}</p>
                                    <p className="truncate text-xs text-emerald-600 font-medium">{d.discount_text}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Upcoming Events</label>
                        {(events ?? []).length === 0 && (
                            <div className="py-8 text-center rounded-2xl bg-muted/10 border border-dashed border-border/50">
                                <p className="text-xs text-muted-foreground">No upcoming events scheduled.</p>
                            </div>
                        )}
                        {(events ?? []).map((e: any) => (
                            <div key={e.id} className="group flex items-center gap-4 rounded-2xl border border-border/50 bg-primary/5 p-4 transition-all hover:bg-primary/10">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <span className="text-[10px] font-black uppercase text-center leading-none">
                                        {new Date(e.event_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold text-foreground">{e.title}</p>
                                    <p className="truncate text-xs text-primary font-medium">{new Date(e.event_date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="px-2">
                <Link
                    href={`/listing/${listing.slug}`}
                    className="group inline-flex items-center gap-2 rounded-xl bg-muted/30 px-4 py-3 text-xs font-bold text-muted-foreground ring-1 ring-border/50 transition-all hover:bg-muted/50 hover:text-foreground active:scale-95 shadow-sm"
                    target="_blank"
                >
                    <ExternalLink className="h-3.5 w-3.5" />
                    VIEW PUBLIC CUSTOMER PAGE
                </Link>
            </div>
        </div>
    );
}
