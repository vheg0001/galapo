"use client";

import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "default" | "destructive";
    loading?: boolean;
}

export default function ConfirmDialog({
    open, onClose, onConfirm, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", variant = "default", loading = false
}: ConfirmDialogProps) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-lg border bg-white p-6 shadow-xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                    {description && <p className="text-sm text-slate-600">{description}</p>}
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={cn(
                            "rounded-md px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60",
                            variant === "destructive"
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-slate-900 hover:bg-slate-800"
                        )}
                    >
                        {loading ? "Processing..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
