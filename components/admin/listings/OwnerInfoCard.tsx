"use client";

import { cn } from "@/lib/utils";
import { User, Mail, Phone, CalendarPlus, Files, ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";

interface OwnerInfoCardProps {
    listing: any;
    ownerListingsCount: number;
    onApproveClaim?: () => void;
    onRejectClaim?: () => void;
}

export default function OwnerInfoCard({ listing, ownerListingsCount, onApproveClaim, onRejectClaim }: OwnerInfoCardProps) {
    const owner = listing.profiles;

    return (
        <div className="overflow-hidden rounded-[2rem] border border-border/50 bg-background/40 p-6 shadow-sm backdrop-blur-sm ring-1 ring-border/50">
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                    <User className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Owner Profile</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Registered contact info</p>
                </div>
            </div>

            {!owner ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/50 bg-muted/20 py-8 text-center px-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/40 text-muted-foreground/40">
                        <User className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-foreground">Unclaimed Listing</p>
                        <p className="text-[11px] font-medium text-muted-foreground">This entry was pre-populated by an administrator.</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <User className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Owner Name</label>
                            <p className="truncate text-sm font-bold text-foreground">{owner.full_name ?? "Private Owner"}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Mail className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Email Address</label>
                            <p className="truncate text-sm font-medium text-foreground">{owner.email ?? "N/A"}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Phone className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Contact Number</label>
                            <p className="truncate text-sm font-medium text-foreground">{owner.phone ?? "N/A"}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="flex flex-col gap-1.5 rounded-2xl bg-muted/30 p-3 ring-1 ring-border/50">
                            <div className="flex items-center gap-1.5 text-muted-foreground/50">
                                <CalendarPlus className="h-3 w-3" />
                                <label className="text-[9px] font-black uppercase tracking-widest">Registered</label>
                            </div>
                            <p className="text-xs font-bold">{owner.created_at ? new Date(owner.created_at).toLocaleDateString() : "N/A"}</p>
                        </div>
                        <div className="rounded-2xl bg-muted/30 p-3 ring-1 ring-border/50">
                            <label className="mb-0.5 block text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">Total Listings</label>
                            <p className="text-xs font-bold">{ownerListingsCount}</p>
                        </div>
                    </div>
                </div>
            )}

            {listing.status === "claimed_pending" && (
                <div className="mt-6 overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/5 shadow-sm animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-2 bg-amber-500/10 px-4 py-2 border-b border-amber-500/10">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Verification Pending</span>
                    </div>
                    <div className="p-4 space-y-4">
                        <p className="text-xs font-medium text-amber-800 leading-relaxed">
                            A user has requested to claim this business. Review their proof documents below.
                        </p>

                        {listing.claim_proof_url && (
                            <a
                                href={listing.claim_proof_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg bg-background px-3 py-2 text-xs font-bold text-amber-700 shadow-sm ring-1 ring-amber-500/20 transition-all hover:bg-amber-50 hover:shadow-md"
                            >
                                <Files className="h-3.5 w-3.5" />
                                VIEW PROOF DOCUMENT
                            </a>
                        )}

                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={onApproveClaim}
                                className="flex h-9 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-[11px] font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 hover:scale-[1.02] active:scale-95"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                APPROVE CLAIM
                            </button>
                            <button
                                type="button"
                                onClick={onRejectClaim}
                                className="flex h-9 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 px-4 text-[11px] font-bold text-red-600 transition-all hover:bg-red-500/10 active:scale-95"
                            >
                                REJECT CLAIM
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
