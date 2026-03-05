"use client";

interface ApprovalDialogProps {
    open: boolean;
    loading?: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function ApprovalDialog({ open, loading = false, onClose, onConfirm }: ApprovalDialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="w-full max-w-md rounded-xl border border-border bg-background p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-semibold">Approve Listing</h2>
                <p className="mt-1 text-sm text-muted-foreground">Approve and notify the business owner?</p>
                <div className="mt-4 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-2 text-sm">
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={loading}
                        onClick={onConfirm}
                        className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        {loading ? "Approving..." : "Approve"}
                    </button>
                </div>
            </div>
        </div>
    );
}
