"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

interface Category {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
    listing_count?: number;
}

interface CategoryMegaMenuProps {
    categories: Category[];
}

export default function CategoryMegaMenu({ categories }: CategoryMegaMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
    };

    // Close on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <div
            ref={menuRef}
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button
                className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                Categories
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute left-1/2 top-full z-50 mt-1 w-[640px] -translate-x-1/2 rounded-xl border border-border bg-card p-6 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">Browse Categories</h3>
                        <Link
                            href="/olongapo/categories"
                            className="text-xs font-medium text-secondary hover:underline"
                            onClick={() => setIsOpen(false)}
                        >
                            View All →
                        </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        {categories.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/olongapo/${cat.slug}`}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            >
                                <span className="text-lg">{cat.icon || "📁"}</span>
                                <div className="flex flex-col">
                                    <span className="font-medium">{cat.name}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {cat.listing_count || 0} listings
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
