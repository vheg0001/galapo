"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface HardDeleteModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    itemName?: string;
    loading?: boolean;
}

export default function HardDeleteModal({
    open,
    onClose,
    onConfirm,
    title = "Permanent Deletion",
    description = "Are you absolutely sure? This action cannot be undone. This will permanently delete the record and all its associated data, including images and analytics.",
    itemName,
    loading = false,
}: HardDeleteModalProps) {
    const [confirmation, setConfirmation] = useState("");

    if (!open) return null;

    const isValid = confirmation === "DELETE";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />

            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <h3 className="text-sm font-bold text-foreground">{title}</h3>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {description}
                    </p>

                    {itemName && (
                        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                            <p className="text-xs font-bold text-red-600">Deleting:</p>
                            <p className="mt-1 text-sm font-medium text-foreground">{itemName}</p>
                        </div>
                    )}

                    <div className="mt-6 space-y-3">
                        <label htmlFor="delete-confirm" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Type <span className="text-foreground">DELETE</span> to confirm
                        </label>
                        <input
                            id="delete-confirm"
                            type="text"
                            autoFocus
                            value={confirmation}
                            onChange={(e) => setConfirmation(e.target.value)}
                            placeholder="Type DELETE"
                            className="h-11 w-full rounded-xl border border-border bg-muted/30 px-4 text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/30 focus:border-red-500/50 focus:bg-background focus:ring-4 focus:ring-red-500/10"
                        />
                    </div>
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-border/50 bg-muted/30 p-6 sm:flex-row sm:justify-end sm:gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-11 rounded-xl px-6 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={!isValid || loading}
                        className={cn(
                            "h-11 rounded-xl px-8 text-sm font-bold text-white shadow-lg transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50",
                            "bg-red-600 hover:bg-red-700 shadow-red-500/20"
                        )}
                    >
                        {loading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        ) : (
                            "Permanently Delete"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
