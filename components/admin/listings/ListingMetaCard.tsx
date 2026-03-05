"use client";

import { cn } from "@/lib/utils";
import { Hash, Calendar, History, ShieldCheck, Zap, Star } from "lucide-react";

interface ListingMetaCardProps {
    listing: any;
    onToggleActive?: () => void;
    onToggleFeatured?: () => void;
}

export default function ListingMetaCard({ listing }: ListingMetaCardProps) {
    const isActive = !!listing.is_active;
    const isFeatured = !!listing.is_featured;

    return (
        <div className="overflow-hidden rounded-[2rem] border border-border/50 bg-background/40 p-6 shadow-sm backdrop-blur-sm ring-1 ring-border/50">
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
                    <Zap className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Listing Meta</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">System & visibility data</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Hash className="h-4 w-4" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">System ID</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-foreground truncate max-w-[120px]">{listing.id}</span>
                </div>

                <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Created</span>
                    </div>
                    <span className="text-xs font-bold text-foreground">
                        {new Date(listing.created_at).toLocaleDateString()}
                    </span>
                </div>

                <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <History className="h-4 w-4" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Updated</span>
                    </div>
                    <span className="text-xs font-bold text-foreground">
                        {new Date(listing.updated_at).toLocaleDateString()}
                    </span>
                </div>

                <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Verified</span>
                    </div>
                    <span className="text-xs font-bold text-foreground">
                        {listing.last_verified_at ? new Date(listing.last_verified_at).toLocaleDateString() : "Never"}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className={cn(
                        "flex flex-col items-center gap-1 rounded-2xl border p-3 transition-colors",
                        isActive
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                            : "bg-red-500/10 border-red-500/20 text-red-600"
                    )}>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Status</span>
                        <span className="text-xs font-bold">{isActive ? "ACTIVE" : "INACTIVE"}</span>
                    </div>

                    <div className={cn(
                        "flex flex-col items-center gap-1 rounded-2xl border p-3 transition-colors",
                        isFeatured
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-600"
                            : "bg-slate-500/10 border-slate-500/20 text-slate-500"
                    )}>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Featured</span>
                        <div className="flex items-center gap-1.5">
                            <Star className={cn("h-3 w-3", isFeatured && "fill-amber-500")} />
                            <span className="text-xs font-bold">{isFeatured ? "YES" : "NO"}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-2 rounded-2xl bg-primary/5 border border-primary/10 p-4 text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 block mb-1">Current Plan</span>
                    <span className="text-lg font-black tracking-tight text-primary uppercase">
                        {listing.is_premium ? "Premium" : listing.is_featured ? "Featured" : "Free"}
                    </span>
                </div>
            </div>
        </div>
    );
}
