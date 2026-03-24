"use client";

import { CreditCard, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPeso } from "@/lib/subscription-helpers";
import type { PaymentInstructionsConfig } from "@/lib/types";

interface PaymentInstructionsProps {
    config: PaymentInstructionsConfig;
    method: "gcash" | "bank_transfer";
    onMethodChange: (method: "gcash" | "bank_transfer") => void;
}

export default function PaymentInstructions({ config, method, onMethodChange }: PaymentInstructionsProps) {
    if (!config) return null;
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={() => onMethodChange("gcash")}
                    className={cn(
                        "flex flex-col items-center gap-3 rounded-2xl border-2 p-4 transition-all",
                        method === "gcash" ? "border-blue-500 bg-blue-50" : "border-slate-100 bg-white hover:border-slate-200"
                    )}
                >
                    <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full",
                        method === "gcash" ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400"
                    )}>
                        <QrCode className="h-5 w-5" />
                    </div>
                    <span className={cn("text-xs font-bold uppercase tracking-wider", method === "gcash" ? "text-blue-700" : "text-slate-500")}>
                        GCash
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => onMethodChange("bank_transfer")}
                    className={cn(
                        "flex flex-col items-center gap-3 rounded-2xl border-2 p-4 transition-all",
                        method === "bank_transfer" ? "border-slate-900 bg-slate-50" : "border-slate-100 bg-white hover:border-slate-200"
                    )}
                >
                    <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full",
                        method === "bank_transfer" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
                    )}>
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <span className={cn("text-xs font-bold uppercase tracking-wider", method === "bank_transfer" ? "text-slate-900" : "text-slate-500")}>
                        Bank Transfer
                    </span>
                </button>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                {method === "gcash" ? (
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-4 space-y-1">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">GCash Payment</h4>
                            <p className="text-xs text-slate-500 font-medium">Send the exact amount below</p>
                        </div>
                        
                        <div className="mb-6 rounded-3xl bg-slate-50 p-6 flex flex-col items-center w-full">
                            <p className="text-3xl font-black text-blue-600">{formatPeso(config.amount)}</p>
                            <div className="mt-4 pt-4 border-t border-slate-200 w-full space-y-3">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">GCash Number</p>
                                    <p className="text-lg font-black text-slate-900 tracking-wider">
                                        {config.gcash_number}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account Name</p>
                                    <p className="text-sm font-bold text-slate-700">
                                        {config.gcash_name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {config.gcash_qr_url && (
                            <div className="mb-4">
                                {/* Placeholder for QR code image if one exists */}
                                <div className="aspect-square w-40 overflow-hidden rounded-2xl border-4 border-white bg-slate-200 shadow-lg">
                                    <img src={config.gcash_qr_url} alt="GCash QR Code" className="h-full w-full object-contain" />
                                </div>
                                <p className="mt-2 text-[10px] font-bold text-slate-400">Scan to Pay</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="text-center space-y-1">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Bank Transfer</h4>
                            <p className="text-xs text-slate-500 font-medium font-medium">Send the exact amount below</p>
                        </div>
                        
                        <div className="rounded-3xl bg-slate-50 p-6">
                            <div className="text-center mb-6">
                                <p className="text-3xl font-black text-slate-900">{formatPeso(config.amount)}</p>
                            </div>
                            
                            <div className="space-y-4 pt-4 border-t border-slate-200">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bank Name</p>
                                        <p className="text-sm font-bold text-slate-900">{config.bank_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account Name</p>
                                        <p className="text-sm font-bold text-slate-900">{config.bank_account_name}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account Number</p>
                                    <p className="text-lg font-black text-slate-900 tracking-wider">{config.bank_account}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-6 rounded-2xl bg-amber-50 p-4 border border-amber-100">
                    <p className="text-xs font-medium leading-relaxed text-amber-800">
                        <span className="font-bold">Important:</span> {config.instructions_text}
                    </p>
                </div>
            </div>
        </div>
    );
}
