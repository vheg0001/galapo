"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Tag, Loader2, AlertCircle, MoreVertical, Edit2, Trash2, Copy, Power } from "lucide-react";
import PlanLimitIndicator from "@/components/business/deals/PlanLimitIndicator";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function BusinessDealsPage() {
    const [deals, setDeals] = useState<any[]>([]);
    const [limits, setLimits] = useState<Array<{
        listing_id: string;
        business_name: string;
        plan: "free" | "featured" | "premium";
        max: number;
        used: number;
        remaining: number;
    }>>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchDeals();
    }, []);

    const fetchDeals = async () => {
        try {
            const res = await fetch("/api/business/deals");
            const data = await res.json();
            setDeals(data.data || []);
            setLimits(Array.isArray(data.limits) ? data.limits : []);
        } catch (err) {
            console.error("Failed to fetch deals", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this deal?")) return;
        try {
            const res = await fetch(`/api/business/deals/${id}`, { method: "DELETE" });
            if (res.ok) fetchDeals();
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/business/deals/${id}`, {
                method: "PATCH",
                body: JSON.stringify({ is_active: !currentStatus })
            });
            if (res.ok) fetchDeals();
        } catch (err) {
            console.error("Status toggle failed", err);
        }
    };

    const filteredDeals = deals.filter(d =>
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.listing?.business_name.toLowerCase().includes(search.toLowerCase())
    );

    const hasAvailableSlots = limits.some((l) => l.remaining > 0);

    const usageByPlan = useMemo(() => {
        const grouped = limits.reduce((acc, current) => {
            const existing = acc[current.plan] || {
                plan: current.plan,
                used: 0,
                total: 0,
                listingsCount: 0,
            };

            existing.used += current.used;
            existing.total += current.max;
            existing.listingsCount += 1;

            acc[current.plan] = existing;
            return acc;
        }, {} as Record<string, { plan: string; used: number; total: number; listingsCount: number }>);

        const orderedPlans = ["free", "featured", "premium"] as const;
        const planLabels: Record<(typeof orderedPlans)[number], string> = {
            free: "Free",
            featured: "Featured",
            premium: "Premium",
        };

        return orderedPlans
            .map((plan) => grouped[plan])
            .filter(Boolean)
            .map((plan) => ({
                ...plan,
                label: planLabels[plan.plan as keyof typeof planLabels],
            }));
    }, [limits]);

    return (
        <div className="space-y-8 p-6 lg:p-10">
            {/* Header */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900">Deals & Offers</h1>
                    <p className="mt-1 text-sm text-gray-500">Promote your business with special discounts and limited-time offers.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/business/deals/new"
                        className={cn(
                            "flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold shadow-lg transition active:scale-95",
                            !hasAvailableSlots
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-[#FF6B35] text-white shadow-[#FF6B35]/20 hover:bg-[#FF6B35]/90"
                        )}
                        onClick={(e) => !hasAvailableSlots && e.preventDefault()}
                    >
                        <Plus size={18} />
                        Create New Deal
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Left: Deals List */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search deals..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-gray-100 bg-white py-3 pl-11 pr-4 text-sm transition focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/20"
                        />
                    </div>

                    {loading ? (
                        <div className="flex h-60 flex-col items-center justify-center gap-3">
                            <Loader2 size={32} className="animate-spin text-[#FF6B35]" />
                            <p className="text-sm font-medium text-gray-400">Loading your deals...</p>
                        </div>
                    ) : filteredDeals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/50 py-20 text-center">
                            <Tag size={40} className="mb-4 text-gray-200" />
                            <h3 className="text-lg font-bold text-gray-900">No deals found</h3>
                            <p className="mt-1 max-w-xs text-sm text-gray-500">
                                {search ? "Try a different search term." : "Ready to boost your sales? Create your first deal!"}
                            </p>
                            {!search && (
                                <Link href="/business/deals/new" className="mt-6 font-bold text-[#FF6B35] hover:underline">
                                    Create a deal now →
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredDeals.map((deal) => (
                                <div key={deal.id} className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 transition hover:border-[#FF6B35]/30 hover:shadow-xl hover:shadow-gray-200/50 sm:flex-row sm:items-center">
                                    {/* Image */}
                                    <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-gray-50 sm:h-20 sm:w-20">
                                        {deal.image_url ? (
                                            <Image src={deal.image_url} alt={deal.title} fill className="object-cover" />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-2xl">🏷️</div>
                                        )}
                                        <div className="absolute left-1 top-1">
                                            <Badge className={cn(
                                                "text-[10px] font-bold uppercase",
                                                deal.is_active ? "bg-green-500" : "bg-gray-400"
                                            )}>
                                                {deal.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="truncate font-bold text-gray-900">{deal.title}</h4>
                                                <p className="text-xs font-medium text-[#FF6B35]">{deal.discount_text}</p>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <AlertCircle size={12} />
                                                Exp: {new Date(deal.end_date).toLocaleDateString()}
                                            </span>
                                            <span className="truncate">
                                                Listing: <span className="font-semibold text-gray-600">{deal.listing?.business_name}</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 border-t border-gray-50 pt-3 sm:border-0 sm:pt-0">
                                        <Link
                                            href={`/business/deals/${deal.id}`}
                                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-500 transition hover:bg-[#FF6B35]/10 hover:text-[#FF6B35]"
                                        >
                                            <Edit2 size={16} />
                                        </Link>
                                        <button
                                            onClick={() => toggleStatus(deal.id, deal.is_active)}
                                            className={cn(
                                                "flex h-9 w-9 items-center justify-center rounded-lg transition",
                                                deal.is_active
                                                    ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                                                    : "bg-green-50 text-green-600 hover:bg-green-100"
                                            )}
                                            title={deal.is_active ? "Deactivate" : "Activate"}
                                        >
                                            <Power size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(deal.id)}
                                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500 transition hover:bg-red-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Info/Limits */}
                <div className="space-y-6">
                    {usageByPlan.map((usage) => (
                        <PlanLimitIndicator
                            key={usage.plan}
                            used={usage.used}
                            total={usage.total}
                            title={`${usage.label} Deal Slot Usage`}
                            subtitle={`${usage.listingsCount} ${usage.listingsCount === 1 ? "listing" : "listings"}`}
                        />
                    ))}

                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 text-blue-900">
                        <h4 className="text-sm font-bold uppercase tracking-wider">Quick Tip</h4>
                        <p className="mt-2 text-sm leading-relaxed opacity-80">
                            Deals from <strong>Premium</strong> and <strong>Featured</strong> listings also appear in the "Hot Deals" section on the main deals page for extra visibility!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
