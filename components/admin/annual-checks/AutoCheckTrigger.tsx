"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Play, Loader2, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface AutoCheckTriggerProps {
    onTriggered: () => void;
    dueCount: number;
}

export default function AutoCheckTrigger({ onTriggered, dueCount }: AutoCheckTriggerProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleTrigger = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/annual-checks/batch-trigger", {
                method: "POST",
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            
            setResult(data);
            toast.success(`Triggered checks for ${data.triggered_count} listings!`);
            onTriggered();
        } catch (err: any) {
            toast.error(err.message || "Failed to trigger batch check");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-100 h-10 px-6">
                    <Play className="h-4 w-4 fill-current" />
                    Run Batch Check
                    {dueCount > 0 && (
                        <span className="ml-2 bg-emerald-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-400">
                            {dueCount}
                        </span>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader className="space-y-3 pb-4 border-b">
                    <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                        <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl">Batch Verification Trigger</DialogTitle>
                        <DialogDescription>
                            Identify and Notify all listings that haven't been verified in over a year.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="py-6 space-y-4">
                    {result ? (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-center space-y-3 animate-in fade-in zoom-in duration-300">
                            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-emerald-200">
                                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xl font-bold text-emerald-900">Success!</h4>
                                <p className="text-sm text-emerald-700">{result.message}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50">
                                <AlertCircle className="h-5 w-5 text-blue-600 mt-1 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-blue-900">Automation Logic</p>
                                    <p className="text-xs text-blue-700 leading-relaxed">
                                        The system will scan all approved business listings. Those with a `last_verified_at` older than 1 year (or null) will receive a verification request. Owners will have 14 days to respond before their listing is flagged for deactivation.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-bold text-gray-900">Eligible Listings</p>
                                    <p className="text-xs text-gray-500">Currently due for annual check</p>
                                </div>
                                <div className="text-2xl font-black text-emerald-600">{dueCount}</div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="pt-4 border-t gap-2 bg-gray-50/50 -mx-6 px-6 -mb-6 pb-6 mt-2">
                    {result ? (
                        <Button className="w-full h-11" onClick={() => { setOpen(false); setResult(null); }}>
                            Close & Refresh Table
                        </Button>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                                Cancel
                            </Button>
                            <Button 
                                className="bg-emerald-600 hover:bg-emerald-700 min-w-[140px] shadow-md shadow-emerald-100 h-11"
                                onClick={handleTrigger}
                                disabled={loading || dueCount === 0}
                            >
                                {loading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                                ) : (
                                    "Trigger Verification"
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
