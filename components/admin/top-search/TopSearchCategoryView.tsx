"use client";

import { useState, useCallback, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CategorySlotCard } from "./CategorySlotCard";

interface Category {
    id: string;
    name: string;
    slug: string;
    icon: string;
}

interface Slot {
    is_available: boolean;
    position: number;
    placement: any;
}

interface CategoryGroup {
    category: Category;
    slots: Slot[];
}

export function TopSearchCategoryView() {
    const [groups, setGroups] = useState<CategoryGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/top-search?format=grouped");
            const json = await res.json();
            setGroups(json.data || []);
        } catch (error) {
            console.error("Failed to load grouped categories:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredGroups = (groups || []).filter(g => 
        g?.category?.name && g.category.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return <div className="py-20 flex justify-center text-muted-foreground animate-pulse font-bold">Loading categories...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Filter categories..."
                    className="pl-10 h-11 bg-white rounded-xl"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {filteredGroups.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed text-muted-foreground">
                    No categories found matching your search.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGroups.map(group => (
                        <CategorySlotCard 
                            key={group.category.id}
                            categoryGroup={group}
                            onUpdated={loadData}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
