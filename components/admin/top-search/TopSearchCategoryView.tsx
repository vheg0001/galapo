"use client";

import { useState, useCallback, useEffect } from "react";
import { CategorySlotCard } from "./CategorySlotCard";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function TopSearchCategoryView() {
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/top-search?format=grouped");
            if (!res.ok) throw new Error("Failed to load grouped categories");
            const json = await res.json();
            setGroups(json.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredGroups = groups.filter(g => 
        g.category.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return <div className="py-20 flex justify-center text-muted-foreground animate-pulse font-bold">Loading categories...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Slots By Category</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Filter categories..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 w-64 bg-white"
                    />
                </div>
            </div>

            {filteredGroups.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed text-muted-foreground">
                    No categories found matching your search.
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
