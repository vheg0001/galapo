"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPeso } from "@/lib/subscription-helpers";
import type { PlanFeatureItem } from "@/lib/subscription-config";

interface PricingCardProps {
    title: string;
    subtitle: string;
    price: number;
    icon?: string;
    ribbon?: string;
    accent?: "free" | "featured" | "premium";
    features: PlanFeatureItem[];
    ctaLabel: string;
    ctaHref?: string;
    onAction?: () => void;
    currentPlan?: boolean;
    disabled?: boolean;
    actionNote?: string;
    className?: string;
}

const accentStyles = {
    free: {
        card: "border-slate-200 bg-white",
        button: "bg-slate-900 text-white hover:bg-slate-800",
        price: "text-slate-900",
    },
    featured: {
        card: "border-orange-300 bg-white shadow-lg shadow-orange-100/60",
        button: "bg-[#FF6B35] text-white hover:bg-[#e85a25]",
        price: "text-[#FF6B35]",
    },
    premium: {
        card: "border-amber-400 bg-gradient-to-b from-amber-50 to-white shadow-lg shadow-amber-100/70",
        button: "bg-amber-500 text-slate-950 hover:bg-amber-400",
        price: "text-amber-600",
    },
} as const;

export default function PricingCard({
    title,
    subtitle,
    price,
    icon,
    ribbon,
    accent = "free",
    features,
    ctaLabel,
    ctaHref,
    onAction,
    currentPlan = false,
    disabled = false,
    actionNote,
    className,
}: PricingCardProps) {
    const styles = accentStyles[accent];
    const isUnavailable = disabled || currentPlan;
    const ctaClassName = cn(
        "inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold transition-all",
        styles.button,
        isUnavailable && "cursor-not-allowed bg-slate-200 text-slate-500 hover:bg-slate-200"
    );

    return (
        <article
            data-testid={`pricing-card-${title.toLowerCase()}`}
            className={cn(
                "relative flex h-full flex-col rounded-3xl border p-6 transition-all sm:p-8",
                styles.card,
                disabled && "opacity-70",
                className
            )}
        >
            {ribbon && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#FF6B35] px-4 py-1 text-xs font-black tracking-[0.18em] text-white">
                    {ribbon}
                </div>
            )}

            {currentPlan && (
                <Badge className="absolute right-4 top-4 bg-slate-900 text-white hover:bg-slate-900">
                    Current Plan
                </Badge>
            )}

            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    {icon ? <span className="text-2xl">{icon}</span> : null}
                    <h3 className="text-2xl font-black text-slate-900">{title}</h3>
                </div>

                <div>
                    <p className={cn("text-4xl font-black tracking-tight", styles.price)}>
                        {formatPeso(price)}
                        <span className="ml-1 text-base font-semibold text-slate-500">/month</span>
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-500">{subtitle}</p>
                </div>
            </div>

            <ul className="mt-8 flex-1 space-y-3">
                {features.map((feature) => (
                    <li key={`${title}-${feature.label}`} className="flex items-start gap-3 text-sm text-slate-700">
                        <span
                            className={cn(
                                "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full",
                                feature.included ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-500"
                            )}
                        >
                            {feature.included ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        </span>
                        <span>{feature.label}</span>
                    </li>
                ))}
            </ul>

            <div className="mt-8 space-y-3">
                {onAction || isUnavailable ? (
                    <button
                        type="button"
                        onClick={onAction}
                        disabled={isUnavailable}
                        className={ctaClassName}
                    >
                        {currentPlan ? "Current Plan" : ctaLabel}
                    </button>
                ) : (
                    <Link
                        href={ctaHref || "#"}
                        className={cn(
                            "inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold transition-all",
                            styles.button
                        )}
                    >
                        {ctaLabel}
                    </Link>
                )}

                {actionNote ? <p className="text-center text-xs text-slate-500">{actionNote}</p> : null}
            </div>
        </article>
    );
}
