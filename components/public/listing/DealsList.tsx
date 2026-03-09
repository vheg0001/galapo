"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Tag, Clock, ChevronDown, CheckCircle2, Share2, Scan, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import ExpiryCountdown from "@/components/shared/ExpiryCountdown";
import DiscountBadge from "@/components/shared/DiscountBadge";

interface Deal {
    id: string;
    title: string;
    description: string;
    image_url: string | null;
    discount_text: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    terms_conditions?: string | null;
}

interface DealsListProps {
    deals: Deal[];
    businessName: string;
}

export default function DealsList({ deals, businessName }: DealsListProps) {
    const searchParams = useSearchParams();
    const dealRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const [expandedTerms, setExpandedTerms] = useState<{ [key: string]: boolean }>({});
    const [showInStoreDeal, setShowInStoreDeal] = useState<Deal | null>(null);

    useEffect(() => {
        const dealId = searchParams.get("id");
        if (dealId && dealRefs.current[dealId]) {
            setTimeout(() => {
                dealRefs.current[dealId]?.scrollIntoView({ behavior: "smooth", block: "center" });
                dealRefs.current[dealId]?.classList.add("ring-4", "ring-primary/20", "scale-[1.02]");
                setTimeout(() => {
                    dealRefs.current[dealId]?.classList.remove("ring-4", "ring-primary/20", "scale-[1.02]");
                }, 3000);
            }, 500);
        }
    }, [searchParams]);

    if (!deals || deals.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <div className="mb-4 text-4xl opacity-20">🏷️</div>
                <p className="font-medium uppercase tracking-widest text-[10px]">No active deals</p>
                <p className="mt-1 text-sm">Check back later for new offers from this business.</p>
            </div>
        );
    }

    const toggleTerms = (id: string) => {
        setExpandedTerms(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="space-y-8 py-4">
            {deals.map((deal) => (
                <div
                    key={deal.id}
                    ref={(el: HTMLDivElement | null) => { dealRefs.current[deal.id] = el; }}
                    className="group relative overflow-hidden rounded-[2.5rem] border border-border/40 bg-background shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-primary/5"
                >
                    {/* Deal Image/Header */}
                    <div className="relative aspect-[21/9] w-full overflow-hidden bg-muted md:aspect-[3/1]">
                        {deal.image_url ? (
                            <Image
                                src={deal.image_url}
                                alt={deal.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                sizes="(max-width: 1024px) 100vw, 800px"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 text-6xl">🏷️</div>
                        )}

                        {/* Status/Badge Overlays */}
                        <div className="absolute right-6 top-6 z-10">
                            <DiscountBadge text={deal.discount_text} size="lg" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        <div className="absolute bottom-6 left-6 right-6">
                            <h3 className="text-2xl font-black tracking-tight text-white md:text-3xl">
                                {deal.title}
                            </h3>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex-1 space-y-4">
                                <div className="flex flex-wrap items-center gap-4">
                                    <ExpiryCountdown endDate={deal.end_date} className="scale-110 origin-left" />
                                    <div className="h-1 w-1 rounded-full bg-border" />
                                    <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                                        Valid: {new Date(deal.start_date).toLocaleDateString()} - {new Date(deal.end_date).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-base leading-relaxed text-muted-foreground font-medium">
                                    {deal.description}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 lg:flex-col lg:items-stretch lg:w-48">
                                <button
                                    onClick={() => setShowInStoreDeal(deal)}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Scan className="h-4 w-4" />
                                    Use in Store
                                </button>
                                <button
                                    className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/50 transition-all hover:bg-muted active:scale-90 lg:w-full lg:gap-2"
                                >
                                    <Share2 className="h-4 w-4" />
                                    <span className="hidden lg:inline text-xs font-black uppercase tracking-widest">Share</span>
                                </button>
                            </div>
                        </div>

                        {/* Terms & Conditions */}
                        {deal.terms_conditions && (
                            <div className="mt-8 border-t border-border/40 pt-6">
                                <button
                                    onClick={() => toggleTerms(deal.id)}
                                    className="flex w-full items-center justify-between group/btn"
                                >
                                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 group-hover/btn:text-primary transition-colors">
                                        Terms & Conditions
                                    </span>
                                    <ChevronDown className={cn(
                                        "h-4 w-4 text-muted-foreground/40 transition-transform duration-300",
                                        expandedTerms[deal.id] && "rotate-180 text-primary"
                                    )} />
                                </button>
                                {expandedTerms[deal.id] && (
                                    <div className="mt-4 animate-in slide-in-from-top-2 fade-in duration-300">
                                        <div className="rounded-2xl bg-muted/30 p-5">
                                            <p className="text-xs font-medium leading-relaxed text-muted-foreground italic">
                                                {deal.terms_conditions}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* In-Store Presentation Modal */}
            {showInStoreDeal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="relative w-full max-w-lg overflow-hidden rounded-[3rem] bg-white text-slate-900 shadow-2xl">
                        <button
                            onClick={() => setShowInStoreDeal(null)}
                            className="absolute right-6 top-6 z-10 h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="p-10 text-center">
                            <div className="mb-8 flex justify-center">
                                <div className="h-20 w-20 flex items-center justify-center rounded-3xl bg-green-50 text-green-600">
                                    <CheckCircle2 className="h-10 w-10" />
                                </div>
                            </div>

                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Exclusive Deal at</p>
                            <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-8">{businessName}</h2>

                            <div className="rounded-[2.5rem] bg-slate-50 p-10 border-2 border-dashed border-slate-200">
                                <DiscountBadge text={showInStoreDeal.discount_text} size="lg" className="mx-auto mb-6 scale-150 rotate-0" />
                                <h3 className="text-xl font-bold tracking-tight mb-2">{showInStoreDeal.title}</h3>
                                <p className="text-sm font-medium text-slate-500 mb-8">{showInStoreDeal.description}</p>

                                <div className="bg-white rounded-2xl p-4 shadow-sm inline-block">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1">Presented on</p>
                                    <p className="text-xs font-bold text-slate-600">{new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}</p>
                                </div>
                            </div>

                            <p className="mt-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Please show this screen to the staff to avail
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
