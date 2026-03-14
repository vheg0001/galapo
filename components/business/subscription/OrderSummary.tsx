"use client";

import { CheckCircle2, Store, CreditCard, Calendar } from "lucide-react";
import { format } from "date-fns";
import { formatPeso } from "@/lib/subscription-helpers";
import type { PlanTier } from "@/lib/types";

interface OrderSummaryProps {
    listingName: string;
    plan: PlanTier;
    price: number;
}

export default function OrderSummary({ listingName, plan, price }: OrderSummaryProps) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    return (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-slate-900 px-6 py-4">
                <h3 className="flex items-center gap-2.5 text-sm font-black uppercase tracking-[0.15em] text-white">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Order Summary
                </h3>
            </div>
            
            <div className="p-6 space-y-6">
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="mt-1 rounded-xl bg-slate-100 p-2 text-slate-500">
                            <Store className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Listing Name</p>
                            <p className="text-sm font-black text-slate-900">{listingName}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="mt-1 rounded-xl bg-slate-100 p-2 text-slate-500">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plan Selected</p>
                            <p className="text-sm font-black text-[#FF6B35] uppercase">{plan} listing</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="mt-1 rounded-xl bg-slate-100 p-2 text-slate-500">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Billing Period</p>
                            <p className="text-sm font-bold text-slate-700">
                                {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                    <div className="flex items-center justify-between">
                        <span className="text-base font-black text-slate-900">Total to Pay</span>
                        <span className="text-2xl font-black text-slate-900">{formatPeso(price)}</span>
                    </div>
                    <p className="mt-1 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">One-time payment for 30 days</p>
                </div>
            </div>
        </div>
    );
}
