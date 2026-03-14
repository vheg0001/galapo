"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLAN_CARD_META } from "@/lib/subscription-config";
import { formatPeso } from "@/lib/subscription-helpers";
import type { PlanTier, PricingResponse } from "@/lib/types";

interface PlanSelectorProps {
    currentPlan: PlanTier;
    selectedPlan: PlanTier | null;
    onSelect: (plan: PlanTier) => void;
    pricing: PricingResponse;
}

export default function PlanSelector({ currentPlan, selectedPlan, onSelect, pricing }: PlanSelectorProps) {
    const plans = useMemo(() => [
        {
            ...PLAN_CARD_META.featured,
            price: pricing.featured_monthly,
        },
        {
            ...PLAN_CARD_META.premium,
            price: pricing.premium_monthly,
        },
    ], [pricing]);

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {plans.map((card) => {
                const isCurrent = currentPlan === card.plan;
                const isSelected = selectedPlan === card.plan;
                
                return (
                    <button
                        key={card.plan}
                        type="button"
                        onClick={() => onSelect(card.plan)}
                        disabled={isCurrent}
                        className={cn(
                            "relative flex flex-col rounded-3xl border-2 p-6 text-left transition-all",
                            isSelected 
                                ? "border-[#FF6B35] bg-orange-50/30 ring-4 ring-orange-100" 
                                : "border-slate-200 bg-white hover:border-slate-300",
                            isCurrent && "cursor-not-allowed opacity-60 grayscale-[0.5]"
                        )}
                    >
                        {isCurrent && (
                            <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                                <Check className="h-3 w-3" />
                                Current
                            </div>
                        )}

                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{card.icon}</span>
                                <h3 className="text-xl font-black text-slate-900">{card.title}</h3>
                            </div>
                            <p className="text-2xl font-black text-[#FF6B35]">
                                {formatPeso(card.price)}
                                <span className="ml-1 text-sm font-semibold text-slate-500">/mo</span>
                            </p>
                        </div>

                        <ul className="mt-6 flex-1 space-y-2.5">
                            {card.features.slice(0, 5).map((feature) => (
                                <li key={feature.label} className="flex items-start gap-2.5 text-sm text-slate-600">
                                    <div className={cn(
                                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                                        feature.included ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                                    )}>
                                        <Check className="h-2.5 w-2.5 font-bold" />
                                    </div>
                                    <span className={cn(!feature.included && "line-through opacity-50")}>
                                        {feature.label}
                                    </span>
                                </li>
                            ))}
                            <li className="pt-1 text-xs font-bold text-slate-400 italic">
                                + more benefits
                            </li>
                        </ul>

                        <div className={cn(
                            "mt-6 flex w-full items-center justify-center rounded-2xl py-3 text-sm font-bold transition-all",
                            isSelected 
                                ? "bg-[#FF6B35] text-white" 
                                : "bg-slate-100 text-slate-600"
                        )}>
                            {isCurrent ? "Already Subscribed" : isSelected ? "Plan Selected" : "Select This Plan"}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
