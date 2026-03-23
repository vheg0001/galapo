"use client";

import { useState } from "react";
import { 
    XCircle, 
    X, 
    Loader2,
    MessageSquare,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface RejectDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    amount: number;
    businessName: string;
}

const REJECTION_TEMPLATES = [
    "Payment amount doesn't match. Expected amount was not received.",
    "Unable to verify this transaction reference. Please resend proof.",
    "Payment was not received in our account. Please check with your bank.",
    "Screenshot is unclear or cropped. Please upload a clearer image.",
    "Incorrect reference number provided. Please check and try again."
];

export default function RejectDialog({ 
    isOpen, 
    onClose, 
    onConfirm, 
    amount,
    businessName 
}: RejectDialogProps) {
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState("");

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (!reason.trim()) return;
        setLoading(true);
        try {
            await onConfirm(reason);
            onClose();
        } catch (error) {
            console.error("Rejection failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                        <XCircle className="h-6 w-6" />
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mt-4">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Reject Payment?</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Provide a reason for rejecting the payment from <span className="font-black text-slate-900">{businessName}</span>. The owner will be notified to re-upload.
                    </p>
                    
                    {/* Templates */}
                    <div className="mt-4 space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Quick Templates</p>
                        <div className="flex flex-wrap gap-2">
                            {REJECTION_TEMPLATES.map((template, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setReason(template)}
                                    className="text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors text-left"
                                >
                                    {template.substring(0, 30)}...
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reason Input */}
                    <div className="mt-4 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Rejection Reason (Required)</label>
                        <Textarea
                            placeholder="Enter detailed reason here..."
                            className="rounded-xl border-slate-200 min-h-[100px] text-sm font-medium"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1 rounded-xl border-slate-200 font-bold text-slate-700"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        className="flex-1 rounded-xl bg-slate-900 font-bold text-white hover:bg-slate-800 shadow-lg shadow-slate-100"
                        onClick={handleConfirm}
                        disabled={loading || !reason.trim()}
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Send Rejection
                    </Button>
                </div>
            </div>
        </div>
    );
}
