"use client";

import { useState } from "react";
import { 
    CheckCircle2, 
    AlertTriangle, 
    X, 
    Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPeso } from "@/lib/subscription-helpers";

interface VerifyDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    amount: number;
    businessName: string;
}

export default function VerifyDialog({ 
    isOpen, 
    onClose, 
    onConfirm, 
    amount,
    businessName 
}: VerifyDialogProps) {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
            onClose();
        } catch (error) {
            console.error("Verification failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mt-4">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Verify Payment?</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        You are about to verify the payment of <span className="font-black text-slate-900">{formatPeso(amount)}</span> from <span className="font-black text-slate-900">{businessName}</span>.
                    </p>
                    
                    <div className="mt-4 rounded-2xl bg-amber-50 p-4 border border-amber-100">
                        <div className="flex gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                            <div className="space-y-1">
                                <p className="text-xs font-black text-amber-900 uppercase tracking-wider">Action Results</p>
                                <ul className="text-[11px] font-medium text-amber-800 list-disc pl-3 space-y-1">
                                    <li>Subscription/Placement will be activated.</li>
                                    <li>Listing flags (Featured/Premium) will be updated.</li>
                                    <li>Invoice will be generated and sent to the owner.</li>
                                </ul>
                            </div>
                        </div>
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
                        className="flex-1 rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100"
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Verify Now
                    </Button>
                </div>
            </div>
        </div>
    );
}
