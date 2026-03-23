"use client";

interface BulkActionsBarProps {
    selectedCount: number;
    onAction: (action: "approve" | "reject" | "activate" | "deactivate" | "delete") => void;
}

export default function BulkActionsBar({ selectedCount, onAction }: BulkActionsBarProps) {
    if (!selectedCount) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/40 p-3">
            <span className="text-xs font-semibold text-foreground">{selectedCount} selected</span>
            <button type="button" onClick={() => onAction("approve")} className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">
                Approve Selected
            </button>
            <button type="button" onClick={() => onAction("reject")} className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white">
                Reject Selected
            </button>
            <button type="button" onClick={() => onAction("activate")} className="rounded-md border border-border px-2.5 py-1 text-xs font-semibold">
                Activate Selected
            </button>
            <button type="button" onClick={() => onAction("deactivate")} className="rounded-md border border-border px-2.5 py-1 text-xs font-semibold">
                Deactivate Selected
            </button>
            <button type="button" onClick={() => onAction("delete")} className="rounded-md border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                Delete Selected
            </button>
        </div>
    );
}
