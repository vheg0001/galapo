"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getPlanChangeDirection } from "@/lib/subscription-helpers";

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
    onSuccess: () => void | Promise<void>;
}) {
    const [loading, setLoading] = useState(false);
    const [newPlan, setNewPlan] = useState(currentPlan === "premium" ? "featured" : "premium");
    const changeDirection = useMemo(
        () => getPlanChangeDirection(currentPlan, newPlan),
        [currentPlan, newPlan]
    );
    const targetPlanLabel = newPlan === "premium" ? "Premium" : "Featured";
    const dialogTitle =
        changeDirection === "downgrade"
            ? "Downgrade Plan"
            : changeDirection === "upgrade"
                ? "Upgrade Plan"
                : "Change Plan";
    const submitLabel =
        changeDirection === "downgrade"
            ? "Confirm Downgrade"
            : changeDirection === "upgrade"
                ? "Confirm Upgrade"
                : "Save Plan";
    const changeDescription =
        changeDirection === "downgrade"
            ? `Downgrade this subscription to ${targetPlanLabel}. This updates the subscription, listing flags, and plan badges without creating a new invoice.`
            : changeDirection === "upgrade"
                ? `Upgrade this subscription to ${targetPlanLabel}. This updates the subscription, listing flags, and plan badges without creating a new invoice.`
                : "Select the target plan for this subscription. This updates the subscription, listing flags, and plan badges without creating a new invoice.";

    useEffect(() => {
        setNewPlan(currentPlan === "premium" ? "featured" : "premium");
    }, [currentPlan, isOpen]);

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
            await onSuccess();
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
                    <DialogTitle>{dialogTitle}</DialogTitle>
                    <DialogDescription>{changeDescription}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpgrade} className="space-y-4">
                    <div className="space-y-3">
                        <Label>Select Plan</Label>
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
                            {loading ? "Saving..." : submitLabel}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
