"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — CategorySelector Component (Module 9.1)
// ──────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Check, ChevronRight, Search } from "lucide-react";
import type { Category } from "@/lib/types";

interface CategorySelectorProps {
    value: string; // parent category id
    subValue: string; // subcategory id
    onChange: (categoryId: string, subcategoryId: string) => void;
}

export default function CategorySelector({ value, subValue, onChange }: CategorySelectorProps) {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        async function fetchCats() {
            try {
                const res = await fetch("/api/categories");
                const data = await res.json();
                setCategories(data);
            } catch (err) {
                console.error("Failed to fetch categories", err);
            } finally {
                setLoading(false);
            }
        }
        fetchCats();
    }, []);

    const selectedParent = categories.find(c => c.id === value);

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.subcategories?.some((s: any) => s.name.toLowerCase().includes(search.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                <div className="h-80 bg-gray-50 rounded-2xl" />
                <div className="h-80 bg-gray-50 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search for a category (e.g. Restaurant, Hotel...)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 py-3.5 pl-12 pr-4 text-sm transition focus:border-[#FF6B35] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/20"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[450px]">
                {/* Parent Categories */}
                <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white">
                    <div className="border-b border-gray-50 bg-gray-50/50 px-4 py-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Primary Category</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                        {filteredCategories.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => onChange(cat.id, "")}
                                className={`group flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm transition ${value === cat.id
                                        ? "bg-[#FF6B35] text-white shadow-md shadow-[#FF6B35]/20"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{cat.icon}</span>
                                    <span className="font-semibold">{cat.name}</span>
                                </div>
                                <ChevronRight size={16} className={value === cat.id ? "text-white/70" : "text-gray-300 group-hover:text-gray-400"} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Subcategories */}
                <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white">
                    <div className="border-b border-gray-50 bg-gray-50/50 px-4 py-3 flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Subcategory</h3>
                        {selectedParent && <span className="text-[10px] font-bold text-[#FF6B35] bg-[#FF6B35]/10 px-2 py-0.5 rounded uppercase">{selectedParent.name}</span>}
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                        {!value ? (
                            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-gray-300">
                                <Check size={32} className="mb-2 opacity-20" />
                                <p className="text-sm font-medium">Select a primary category first</p>
                            </div>
                        ) : selectedParent?.subcategories?.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-gray-300">
                                <p className="text-sm font-medium">No subcategories available</p>
                            </div>
                        ) : (
                            selectedParent?.subcategories?.map((sub: any) => (
                                <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => onChange(value, sub.id)}
                                    className={`flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm transition ${subValue === sub.id
                                            ? "bg-[#FF6B35]/10 text-[#FF6B35] font-bold"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    <span>{sub.name}</span>
                                    {subValue === sub.id && <Check size={16} />}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Selected Summary */}
            {value && (
                <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600 border border-gray-100/50">
                    <span className="font-bold text-gray-400">Selected:</span>
                    <span className="font-semibold text-gray-900">{selectedParent?.name}</span>
                    {subValue && (
                        <>
                            <ChevronRight size={14} className="text-gray-300" />
                            <span className="font-semibold text-gray-900">
                                {selectedParent?.subcategories?.find((s: any) => s.id === subValue)?.name}
                            </span>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
