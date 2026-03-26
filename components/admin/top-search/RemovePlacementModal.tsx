"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const SUGGESTED_REASONS = [
    "Violated Terms of Service",
    "Invalid/Fake Business Info",
    "Payment Verification Failed",
    "Duplicate Placement",
    "Manual Database Cleanup",
];

export function RemovePlacementModal({
    isOpen,
    onClose,
    onConfirm,
    businessName,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    businessName: string;
}) {
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState("");
    const [customReason, setCustomReason] = useState("");

    const finalReason = reason === "Other" ? customReason : reason;

    async function handleConfirm() {
        if (!finalReason) return alert("Please provide or select a reason for removal.");
        
        setLoading(true);
        try {
            await onConfirm(finalReason);
            onClose();
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Failed to remove placement.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Remove Top Search Placement</DialogTitle>
                    <DialogDescription>
                        You are about to remove <span className="font-bold text-foreground">{businessName}</span> from its top search slot.
                        Please provide a reason for the owner.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Suggested Reasons</Label>
                        <div className="grid grid-cols-1 gap-2">
                            {SUGGESTED_REASONS.map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setReason(r)}
                                    className={cn(
                                        "w-full text-left px-3 py-2 text-sm border rounded-lg transition hover:bg-muted font-medium",
                                        reason === r ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20" : "text-muted-foreground"
                                    )}
                                >
                                    {r}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setReason("Other")}
                                className={cn(
                                    "w-full text-left px-3 py-2 text-sm border rounded-lg transition hover:bg-muted font-medium",
                                    reason === "Other" ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20" : "text-muted-foreground"
                                )}
                            >
                                Other (Type below)
                            </button>
                        </div>
                    </div>

                    {reason === "Other" && (
                        <div className="space-y-2">
                            <Label>Custom Reason / Note</Label>
                            <Textarea
                                placeholder="Explain why this placement is being removed..."
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border rounded-xl text-sm font-medium hover:bg-muted transition"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition"
                        disabled={loading || !finalReason}
                    >
                        {loading ? "Removing..." : "Confirm Removal"}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
