"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CancelDialog({
    subscriptionId,
    isOpen,
    onClose,
    onSuccess,
}: {
    subscriptionId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState("");

    async function handleCancel(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "cancel", 
                    effective: "immediate",
                    reason
                }),
            });

            if (!res.ok) throw new Error("Failed to cancel subscription.");
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to cancel subscription.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="border-red-200">
                <DialogHeader>
                    <DialogTitle className="text-red-600">Cancel Subscription</DialogTitle>
                    <DialogDescription>
                        This will immediately cancel the subscription and stop auto-renewal. The listing will lose premium/featured benefits immediately.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCancel} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label>Cancellation Reason (Optional)</Label>
                        <Textarea 
                            placeholder="Admin notes on why this was cancelled..." 
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded-xl text-sm font-medium hover:bg-muted transition"
                            disabled={loading}
                        >
                            Keep Subscription
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition"
                            disabled={loading}
                        >
                            {loading ? "Cancelling..." : "Cancel Immediately"}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
