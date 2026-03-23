"use client";

import { useEffect, useState } from "react";

interface RejectionModalProps {
    open: boolean;
    title?: string;
    loading?: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
}

const TEMPLATES = [
    "Incomplete information — please provide more details",
    "Duplicate listing — this business already exists",
    "Inappropriate content",
    "Unable to verify business existence",
    "Custom reason...",
];

export default function RejectionModal({ open, title = "Reject Listing", loading = false, onClose, onSubmit }: RejectionModalProps) {
    const [template, setTemplate] = useState(TEMPLATES[0]);
    const [reason, setReason] = useState(TEMPLATES[0]);

    useEffect(() => {
        if (!open) return;
        setTemplate(TEMPLATES[0]);
        setReason(TEMPLATES[0]);
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="w-full max-w-lg rounded-xl border border-border bg-background p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">Reason for Rejection is required.</p>
                <div className="mt-3 space-y-2">
                    <select
                        value={template}
                        onChange={(e) => {
                            const value = e.target.value;
                            setTemplate(value);
                            setReason(value === "Custom reason..." ? "" : value);
                        }}
                        className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    >
                        {TEMPLATES.map((tpl) => (
                            <option key={tpl} value={tpl}>
                                {tpl}
                            </option>
                        ))}
                    </select>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={5}
                        placeholder="Enter rejection reason..."
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-2 text-sm">
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={!reason.trim() || loading}
                        onClick={() => onSubmit(reason.trim())}
                        className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        {loading ? "Rejecting..." : "Reject Listing"}
                    </button>
                </div>
            </div>
        </div>
    );
}
