"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ExtendDialog({
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
    const [days, setDays] = useState("30");
    const [reason, setReason] = useState("");

    async function handleExtend(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "extend",
                    days: Number(days),
                    reason
                }),
            });

            if (!res.ok) throw new Error("Failed to extend subscription.");
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to extend subscription.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Extend Subscription</DialogTitle>
                    <DialogDescription>
                        Manually add days to this subscription's end date.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleExtend} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="extend-days">Days to add</Label>
                        <div className="flex gap-2 mb-2">
                            {[7, 14, 30].map(d => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => setDays(d.toString())}
                                    className="px-3 py-1 text-xs border rounded-md hover:bg-muted"
                                >
                                    +{d} days
                                </button>
                            ))}
                        </div>
                        <Input
                            id="extend-days"
                            type="number"
                            min="1"
                            value={days}
                            onChange={(e) => setDays(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="extend-reason">Reason (Optional)</Label>
                        <Textarea 
                            id="extend-reason"
                            placeholder="Admin notes on why this was extended..." 
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded-xl text-sm font-medium hover:bg-muted"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90"
                            disabled={loading}
                        >
                            {loading ? "Extending..." : "Extend"}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
