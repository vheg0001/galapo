"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export function UpgradeDialog({
    subscriptionId,
    currentPlan,
    isOpen,
    onClose,
    onSuccess,
}: {
    subscriptionId: string;
    currentPlan: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [newPlan, setNewPlan] = useState(currentPlan === "premium" ? "featured" : "premium");

    async function handleUpgrade(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "upgrade",
                    new_plan: newPlan
                }),
            });

            if (!res.ok) throw new Error("Failed to change plan.");
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to change plan.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change Subscription Plan</DialogTitle>
                    <DialogDescription>
                        Manually change the plan type for this subscription. This does NOT automatically create a new invoice or process payment.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpgrade} className="space-y-4">
                    <div className="space-y-3">
                        <Label>Select New Plan</Label>
                        <div className="flex gap-4">
                            <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition ${newPlan === 'premium' ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500' : 'hover:bg-muted'}`}>
                                <input type="radio" className="sr-only" name="plan" value="premium" checked={newPlan === 'premium'} onChange={() => setNewPlan('premium')} />
                                <div className="text-sm font-bold text-amber-700">Premium Plan</div>
                            </label>
                            <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition ${newPlan === 'featured' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'hover:bg-muted'}`}>
                                <input type="radio" className="sr-only" name="plan" value="featured" checked={newPlan === 'featured'} onChange={() => setNewPlan('featured')} />
                                <div className="text-sm font-bold text-blue-700">Featured Plan</div>
                            </label>
                        </div>
                    </div>
                    <DialogFooter className="mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded-xl text-sm font-medium hover:bg-muted transition"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition"
                            disabled={loading || newPlan === currentPlan}
                        >
                            {loading ? "Saving..." : "Change Plan"}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
