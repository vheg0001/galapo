import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPeso } from "@/lib/subscription-helpers";

interface AddOnCardProps {
    title: string;
    description: string;
    price: number;
    periodLabel: string;
    features: string[];
    buttonLabel: string;
    buttonHref: string;
    availabilityLabel?: string;
    accent?: "orange" | "gold";
}

export default function AddOnCard({
    title,
    description,
    price,
    periodLabel,
    features,
    buttonLabel,
    buttonHref,
    availabilityLabel,
    accent = "orange",
}: AddOnCardProps) {
    return (
        <article
            className={cn(
                "flex h-full flex-col rounded-3xl border p-6 shadow-sm",
                accent === "gold"
                    ? "border-amber-300 bg-gradient-to-br from-amber-50 to-white"
                    : "border-orange-200 bg-white"
            )}
        >
            <div className="space-y-3">
                <h3 className="text-2xl font-black text-slate-900">{title}</h3>
                <p className="text-3xl font-black text-slate-900">
                    {formatPeso(price)}
                    <span className="ml-1 text-base font-semibold text-slate-500">{periodLabel}</span>
                </p>
                <p className="text-sm text-slate-600">{description}</p>
            </div>

            <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-700">
                {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                        <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-[#FF6B35]" />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>

            {availabilityLabel ? <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{availabilityLabel}</p> : null}

            <Link
                href={buttonHref}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
                {buttonLabel}
                <ArrowRight className="h-4 w-4" />
            </Link>
        </article>
    );
}