"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getDefaultPlanTarget, getPlanChangeDirection, normalizePlanType } from "@/lib/subscription-helpers";
import type { PlanTier } from "@/lib/types";

const PLAN_META: Record<PlanTier, { label: string; activeClassName: string; textClassName: string }> = {
    premium: {
        label: "Premium Plan",
        activeClassName: "border-amber-500 bg-amber-50 ring-1 ring-amber-500",
        textClassName: "text-amber-700",
    },
    featured: {
        label: "Featured Plan",
        activeClassName: "border-blue-500 bg-blue-50 ring-1 ring-blue-500",
        textClassName: "text-blue-700",
    },
    free: {
        label: "Free Plan",
        activeClassName: "border-slate-400 bg-slate-50 ring-1 ring-slate-400",
        textClassName: "text-slate-700",
    },
};

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
    const normalizedCurrentPlan = normalizePlanType(currentPlan);
    const [newPlan, setNewPlan] = useState<PlanTier>(() => getDefaultPlanTarget(currentPlan));
    const availablePlans = useMemo(
        () => (["premium", "featured", "free"] as PlanTier[]).filter((plan) => plan !== normalizedCurrentPlan),
        [normalizedCurrentPlan]
    );
    const changeDirection = useMemo(
        () => getPlanChangeDirection(normalizedCurrentPlan, newPlan),
        [normalizedCurrentPlan, newPlan]
    );
    const targetPlanLabel = PLAN_META[newPlan].label.replace(" Plan", "");
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
            ? `Downgrade this subscription to the ${targetPlanLabel} plan. This updates the subscription, listing flags, and plan badges without creating a new invoice.`
            : changeDirection === "upgrade"
                ? `Upgrade this subscription to the ${targetPlanLabel} plan. This updates the subscription, listing flags, and plan badges without creating a new invoice.`
                : "Select the target plan for this subscription. This updates the subscription, listing flags, and plan badges without creating a new invoice.";

    useEffect(() => {
        setNewPlan(getDefaultPlanTarget(currentPlan));
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
                        <div className="grid gap-3 sm:grid-cols-2">
                            {availablePlans.map((plan) => {
                                const isSelected = newPlan === plan;
                                const meta = PLAN_META[plan];

                                return (
                                    <label
                                        key={plan}
                                        className={`flex items-center justify-center gap-2 rounded-xl border p-3 transition cursor-pointer ${
                                            isSelected ? meta.activeClassName : "hover:bg-muted"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            className="sr-only"
                                            name="plan"
                                            value={plan}
                                            checked={isSelected}
                                            onChange={() => setNewPlan(plan)}
                                        />
                                        <div className={`text-sm font-bold ${meta.textClassName}`}>{meta.label}</div>
                                    </label>
                                );
                            })}
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
                            disabled={loading || newPlan === normalizedCurrentPlan}
                        >
                            {loading ? "Saving..." : submitLabel}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
