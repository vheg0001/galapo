"use client";

import { useState } from "react";
import ProofDocumentViewer from "./ProofDocumentViewer";

interface ClaimDetailViewProps {
    claim: any;
    onAction: (action: "approve" | "reject", reason?: string) => Promise<void>;
}

export default function ClaimDetailView({ claim, onAction }: ClaimDetailViewProps) {
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);

    async function handle(action: "approve" | "reject") {
        setSaving(true);
        try {
            await onAction(action, reason.trim());
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-border bg-background p-4">
                <h2 className="text-lg font-semibold">{claim.listing_name}</h2>
                <p className="text-sm text-muted-foreground">{claim.category_name}</p>
                <p className="mt-1 text-xs text-muted-foreground">Status: {claim.status}</p>
            </div>

            <div className="rounded-xl border border-border bg-background p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Claimant Info</h3>
                <div className="mt-2 space-y-1 text-sm">
                    <p>Name: {claim.claimant?.full_name ?? "N/A"}</p>
                    <p>Email: {claim.claimant?.email ?? "N/A"}</p>
                    <p>Phone: {claim.claimant?.phone ?? "N/A"}</p>
                </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Proof Document</h3>
                <div className="mt-3">
                    <ProofDocumentViewer url={claim.claim_proof_url} />
                </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Admin Notes / Rejection Reason</h3>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    placeholder="Required for rejection."
                    className="mt-3 w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
                <div className="mt-3 flex gap-2">
                    <button type="button" disabled={saving} onClick={() => handle("approve")} className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">
                        Approve Claim
                    </button>
                    <button
                        type="button"
                        disabled={saving || !reason.trim()}
                        onClick={() => handle("reject")}
                        className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                        Reject Claim
                    </button>
                </div>
            </div>
        </div>
    );
}
