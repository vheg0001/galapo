"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, ChevronRight, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Category, TopSearchAvailabilityResponse } from "@/lib/types";

interface TopSearchSelectorProps {
    listingId: string;
    categoryId: string;
    subcategoryId?: string | null;
    selectedCategory: Category | null;
    selectedPosition: number | null;
    onSelectCategory: (category: Category) => void;
    onSelectPosition: (position: number) => void;
}

export default function TopSearchSelector({
    listingId,
    categoryId,
    subcategoryId,
    selectedCategory,
    selectedPosition,
    onSelectCategory,
    onSelectPosition,
}: TopSearchSelectorProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [availability, setAvailability] = useState<TopSearchAvailabilityResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (categoryId) {
            // Load only primary and subcategory options for this listing
            async function loadTargetCategories() {
                try {
                    // Fetch the main category and all its children
                    const response = await fetch(`/api/categories?parent_id=${categoryId}&include_parent=true`);
                    const payload = await response.json();
                    if (response.ok) {
                        setCategories(payload.data || []);
                        
                        // Auto-select based on existing subcategoryId if present, else fallback to main category
                        const targetId = subcategoryId || categoryId;
                        const target = (payload.data || []).find((c: any) => c.id === targetId);
                        if (target) onSelectCategory(target);
                    }
                } catch (error) {
                    console.error("Failed to load categories:", error);
                }
            }
            loadTargetCategories();
        }
    }, [categoryId, subcategoryId]);

    useEffect(() => {
        if (!selectedCategory) {
            return;
        }

        const activeCategory = selectedCategory;

        async function checkAvailability() {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/business/top-search/availability?category_id=${activeCategory.id}`);
                const payload = await response.json();
                if (response.ok) {
                    setAvailability(payload);
                    // Auto-select lowest available position ONLY if none selected
                    const available = payload.slots.find((s: any) => s.status === "available");
                    // Check if current selectedPosition is still available in new payload
                    const stillAvailable = payload.slots.find((s: any) => s.position === selectedPosition && s.status === "available");
                    
                    if (!selectedPosition || !stillAvailable) {
                        if (available) onSelectPosition(available.position);
                    }
                }
            } catch (error) {
                console.error("Failed to check availability:", error);
            } finally {
                setIsLoading(false);
            }
        }

        checkAvailability();
    }, [selectedCategory, onSelectPosition]);

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Step 1. Select Target Category</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                    {categories
                        .filter((cat) => cat.id === categoryId || (subcategoryId && cat.id === subcategoryId))
                        .map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => onSelectCategory(cat)}
                                className={cn(
                                    "flex items-center justify-between rounded-2xl border-2 p-4 text-left transition-all",
                                    selectedCategory?.id === cat.id
                                        ? "border-[#FF6B35] bg-orange-50/30 ring-4 ring-orange-100"
                                        : "border-slate-100 bg-white hover:border-slate-200"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-xl",
                                        cat.id === categoryId ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
                                    )}>
                                        <LayoutList className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{cat.name}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            {cat.id === categoryId ? "Main Category" : "Subcategory"}
                                        </p>
                                    </div>
                                </div>
                                {selectedCategory?.id === cat.id && <CheckCircle2 className="h-5 w-5 text-[#FF6B35]" />}
                            </button>
                        ))}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Step 2. Choose Position</h4>
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                </div>

                {!selectedCategory ? (
                    <div className="flex h-32 items-center justify-center rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50/50">
                        <p className="text-xs font-semibold text-slate-400">Please select a category first</p>
                    </div>
                ) : isLoading ? (
                    <div className="flex h-32 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-100 bg-white">
                        <Loader2 className="h-6 w-6 animate-spin text-[#FF6B35]" />
                        <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Checking available slots…</p>
                    </div>
                ) : availability ? (
                    <div className="grid gap-4">
                        {availability.slots.map((slot) => {
                            const isTaken = slot.status === "taken";
                            const isSelected = selectedPosition === slot.position;

                            return (
                                <button
                                    key={slot.position}
                                    type="button"
                                    disabled={isTaken}
                                    onClick={() => onSelectPosition(slot.position)}
                                    className={cn(
                                        "flex items-center justify-between rounded-2xl border-2 p-5 text-left transition-all",
                                        isSelected
                                            ? "border-[#FF6B35] bg-orange-50/30 ring-4 ring-orange-100"
                                            : isTaken
                                            ? "cursor-not-allowed border-slate-50 bg-slate-50 opacity-60"
                                            : "border-slate-100 bg-white hover:border-slate-200"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black",
                                            isSelected ? "bg-[#FF6B35] text-white" : "bg-slate-100 text-slate-400"
                                        )}>
                                            #{slot.position}
                                        </div>
                                        <div>
                                            <p className="text-base font-black text-slate-900">
                                                {slot.position === 1 ? "Top Result" : slot.position === 2 ? "Second Result" : "Third Result"}
                                            </p>
                                            <p className={cn(
                                                "text-xs font-bold",
                                                isTaken ? "text-rose-500" : "text-emerald-500"
                                            )}>
                                                {isTaken ? `Taken by ${slot.listing_name}` : "Available for Purchase"}
                                            </p>
                                        </div>
                                    </div>
                                    {!isTaken && isSelected && <CheckCircle2 className="h-6 w-6 text-[#FF6B35]" />}
                                    {!isTaken && !isSelected && <ChevronRight className="h-5 w-5 text-slate-300" />}
                                </button>
                            );
                        })}
                    </div>
                ) : null}

                <div className="rounded-2xl bg-slate-900 p-4 text-white">
                    <p className="text-xs leading-relaxed opacity-80">
                        <span className="font-bold text-amber-400">Note:</span> Top Search placements are limited to 3 businesses per category. Your listing will stay at the top for 30 days once verified.
                    </p>
                </div>
            </div>
        </div>
    );
}
