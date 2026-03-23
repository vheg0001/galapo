"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Tag, Loader2 } from "lucide-react";
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";
import CategoryTree from "@/components/admin/categories/CategoryTree";
import CategoryDetail from "@/components/admin/categories/CategoryDetail";
import AddCategoryModal from "@/components/admin/categories/AddCategoryModal";

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [addOpen, setAddOpen] = useState(false);
    const [addParentId, setAddParentId] = useState<string | undefined>(undefined);

    async function loadCategories() {
        setLoading(true);
        const res = await fetch("/api/admin/categories");
        const data = await res.json();
        setCategories(data.data ?? []);
        setLoading(false);
    }

    useEffect(() => { loadCategories(); }, []);

    const handleReorder = useCallback(async (reordered: any[]) => {
        setCategories(reordered);

        // Helper to flatten the tree for API
        const flattenCategories = (cats: any[]): any[] => {
            let result: any[] = [];
            cats.forEach(cat => {
                const { subcategories, ...rest } = cat;
                result.push({
                    id: rest.id,
                    sort_order: rest.sort_order,
                    parent_id: rest.parent_id
                });
                if (subcategories && subcategories.length > 0) {
                    result = result.concat(flattenCategories(subcategories));
                }
            });
            return result;
        };

        // Save reordered sort_order to server using bulk API
        try {
            const payload = flattenCategories(reordered);

            const res = await fetch("/api/admin/categories/reorder", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                console.error("Failed to reorder categories:", await res.json());
                loadCategories(); // Rollback if failed
            }
        } catch (error) {
            console.error("Error reordering categories:", error);
            loadCategories();
        }
    }, [loadCategories]);

    const handleAddSubcategory = useCallback((parentId: string) => {
        setAddParentId(parentId);
        setAddOpen(true);
    }, []);

    const parentCategories = categories.filter((c) => !c.parent_id);

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="border-b border-border/50 px-4 md:px-8 py-5">
                <AdminPageHeader
                    title="Category Management"
                    description="Manage categories, subcategories, and their dynamic fields."
                    breadcrumbs={[{ label: "Admin" }, { label: "Categories" }]}
                    actions={
                        <button
                            type="button"
                            onClick={() => { setAddParentId(undefined); setAddOpen(true); }}
                            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:scale-105 active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            Add Category
                        </button>
                    }
                />
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Left Panel — Category Tree */}
                <div className={`${selectedId ? "hidden md:flex" : "flex"} w-full md:w-80 lg:w-96 border-r border-border/50 bg-background/30 overflow-hidden flex-col shrink-0`}>
                    {loading ? (
                        <div className="flex flex-1 items-center justify-center">
                            <div className="space-y-3 w-full px-4 text-center">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary/40 mb-2" />
                                <p className="text-xs text-muted-foreground">Loading categories...</p>
                            </div>
                        </div>
                    ) : (
                        <CategoryTree
                            categories={categories}
                            selectedId={selectedId}
                            onSelect={(cat) => setSelectedId(cat.id)}
                            onReorder={handleReorder}
                            onAddSubcategory={handleAddSubcategory}
                        />
                    )}
                </div>

                {/* Right Panel — Detail */}
                <div className={`${!selectedId ? "hidden md:flex" : "flex"} flex-1 bg-background/20 overflow-hidden`}>
                    {selectedId ? (
                        <CategoryDetail
                            key={selectedId}
                            categoryId={selectedId}
                            parentCategories={parentCategories}
                            onSaved={loadCategories}
                            onDeleted={() => { setSelectedId(null); loadCategories(); }}
                            onBack={() => setSelectedId(null)}
                        />
                    ) : (
                        <div className="hidden md:flex h-full flex-col items-center justify-center gap-4 text-muted-foreground w-full">
                            <div className="rounded-full bg-muted/30 p-6 ring-1 ring-border/50">
                                <Tag className="h-10 w-10 text-muted-foreground/40" />
                            </div>
                            <div className="text-center">
                                <p className="text-base font-semibold">Select a category</p>
                                <p className="text-sm">Click any category in the tree to view and edit details</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <AddCategoryModal
                open={addOpen}
                onClose={() => { setAddOpen(false); setAddParentId(undefined); }}
                onCreated={loadCategories}
                parentCategories={parentCategories}
            />
        </div>
    );
}
