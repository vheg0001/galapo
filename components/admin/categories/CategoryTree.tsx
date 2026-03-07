"use client";

import { useState, useCallback } from "react";
import * as Icons from "lucide-react";
import { ChevronRight, ChevronDown, Search, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
    id: string;
    name: string;
    slug: string;
    icon?: string;
    parent_id: string | null;
    sort_order: number;
    listing_count: number;
    is_active: boolean;
    subcategories: Category[];
}

interface CategoryTreeProps {
    categories: Category[];
    selectedId: string | null;
    onSelect: (category: Category) => void;
    onReorder: (newOrder: Category[]) => void;
    onAddSubcategory: (parentId: string) => void;
}

function CategoryRow({
    cat,
    depth,
    selectedId,
    onSelect,
    onAddSubcategory,
    dragIndex,
    setDragIndex,
    dragOverId,
    setDragOverId,
    onDragEnd,
}: {
    cat: Category;
    depth: number;
    selectedId: string | null;
    onSelect: (cat: Category) => void;
    onAddSubcategory: (parentId: string) => void;
    dragIndex: string | null;
    setDragIndex: (id: string | null) => void;
    dragOverId: string | null;
    setDragOverId: (id: string | null) => void;
    onDragEnd: () => void;
}) {
    const [expanded, setExpanded] = useState(true);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
    const hasChildren = cat.subcategories.length > 0;

    const Icon = cat.icon ? (Icons as any)[cat.icon] : null;

    return (
        <>
            <div
                draggable
                onDragStart={() => setDragIndex(cat.id)}
                onDragOver={(e) => { e.preventDefault(); setDragOverId(cat.id); }}
                onDragEnd={() => { onDragEnd(); setDragIndex(null); setDragOverId(null); }}
                onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY }); }}
                onClick={() => onSelect(cat)}
                className={cn(
                    "group relative flex items-center gap-2 rounded-lg px-2 py-2 cursor-pointer transition-colors",
                    selectedId === cat.id ? "bg-primary/10 text-primary" : "text-sm hover:bg-muted/50",
                    !cat.is_active && "opacity-60",
                    dragOverId === cat.id && dragIndex !== cat.id && "border-t-2 border-primary/50",
                )}
                style={{ paddingLeft: `${8 + depth * 16}px` }}
            >
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />

                {hasChildren ? (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                        className="shrink-0 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
                    >
                        {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                ) : (
                    <span className="w-[18px] shrink-0" />
                )}

                {Icon ? (
                    <Icon className={cn("h-4 w-4 shrink-0", selectedId === cat.id ? "text-primary" : "text-muted-foreground")} />
                ) : (
                    <span className="h-4 w-4 shrink-0 rounded-sm bg-muted/50" />
                )}

                <span className={cn(
                    "flex-1 truncate text-sm font-medium",
                    !cat.is_active && "line-through text-muted-foreground",
                )}>
                    {cat.name}
                </span>

                {cat.listing_count > 0 && (
                    <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-bold text-muted-foreground shrink-0">
                        {cat.listing_count}
                    </span>
                )}

                {contextMenu && (
                    <>
                        <div className="fixed inset-0 z-30" onClick={() => setContextMenu(null)} />
                        <div
                            className="fixed z-40 w-48 rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl py-1 animate-in fade-in duration-100"
                            style={{ left: contextMenu.x, top: contextMenu.y }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {[
                                { label: "Edit", action: () => { onSelect(cat); setContextMenu(null); } },
                                { label: "Add Subcategory", action: () => { onAddSubcategory(cat.id); setContextMenu(null); } },
                                { label: cat.is_active ? "Deactivate" : "Activate", action: () => setContextMenu(null) },
                            ].map((item) => (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={item.action}
                                    className="block w-full px-4 py-2 text-left text-sm hover:bg-muted/50"
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {hasChildren && expanded && cat.subcategories.map((sub) => (
                <CategoryRow
                    key={sub.id}
                    cat={sub}
                    depth={depth + 1}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onAddSubcategory={onAddSubcategory}
                    dragIndex={dragIndex}
                    setDragIndex={setDragIndex}
                    dragOverId={dragOverId}
                    setDragOverId={setDragOverId}
                    onDragEnd={onDragEnd}
                />
            ))}
        </>
    );
}

export default function CategoryTree({ categories, selectedId, onSelect, onReorder, onAddSubcategory }: CategoryTreeProps) {
    const [search, setSearch] = useState("");
    const [dragIndex, setDragIndex] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    const filtered = search.trim()
        ? categories.filter((c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.subcategories.some((s) => s.name.toLowerCase().includes(search.toLowerCase()))
        )
        : categories;

    const handleDragEnd = useCallback(() => {
        if (!dragIndex || !dragOverId || dragIndex === dragOverId) return;

        const processReorder = (items: Category[]): Category[] | null => {
            const fromIdx = items.findIndex((c) => c.id === dragIndex);
            const toIdx = items.findIndex((c) => c.id === dragOverId);

            if (fromIdx !== -1 && toIdx !== -1) {
                const newItems = [...items];
                const [moved] = newItems.splice(fromIdx, 1);
                newItems.splice(toIdx, 0, moved);

                return newItems.map((cat, index) => ({
                    ...cat,
                    sort_order: index * 10
                }));
            }

            for (let i = 0; i < items.length; i++) {
                if (items[i].subcategories.length > 0) {
                    const reorderedSubs = processReorder(items[i].subcategories);
                    if (reorderedSubs) {
                        const newItems = [...items];
                        newItems[i] = { ...items[i], subcategories: reorderedSubs };
                        return newItems;
                    }
                }
            }
            return null;
        };

        const result = processReorder(categories);
        if (result) {
            onReorder(result);
        }

        setDragIndex(null);
        setDragOverId(null);
    }, [dragIndex, dragOverId, categories, onReorder]);

    return (
        <div className="flex flex-col h-full">
            <div className="px-3 py-3 border-b border-border/50">
                <div className="relative flex items-center">
                    <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                        className="w-full rounded-xl border border-border/50 bg-background/50 pl-9 pr-4 py-2 text-sm outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                        placeholder="Search categories..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {filtered.map((cat) => (
                    <CategoryRow
                        key={cat.id}
                        cat={cat}
                        depth={0}
                        selectedId={selectedId}
                        onSelect={onSelect}
                        onAddSubcategory={onAddSubcategory}
                        dragIndex={dragIndex}
                        setDragIndex={(id) => { setDragIndex(id); }}
                        dragOverId={dragOverId}
                        setDragOverId={(id) => { setDragOverId(id); }}
                        onDragEnd={handleDragEnd}
                    />
                ))}
                {filtered.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        {search ? "No categories match your search." : "No categories yet."}
                    </p>
                )}
            </div>
        </div>
    );
}
