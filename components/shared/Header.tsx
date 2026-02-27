"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAppStore } from "@/store/appStore";
import { APP_NAME, NAV_LINKS } from "@/lib/constants";
import { MapPin, Menu, X, Search } from "lucide-react";
import MobileMenu from "./MobileMenu";
import CategoryMegaMenu from "./CategoryMegaMenu";

interface HeaderProps {
    categories?: { id: string; name: string; slug: string; icon?: string | null; listing_count?: number }[];
}

export default function Header({ categories = [] }: HeaderProps) {
    const { isMobileMenuOpen, toggleMobileMenu, isSearchOpen, toggleSearch } = useAppStore();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
            <header
                className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-shadow ${scrolled ? "shadow-md border-border" : "border-transparent"
                    }`}
            >
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <MapPin className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-foreground">
                            {APP_NAME}
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden items-center gap-1 md:flex">
                        {NAV_LINKS.map((link) =>
                            link.label === "Categories" ? (
                                <CategoryMegaMenu key={link.href} categories={categories} />
                            ) : (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                                >
                                    {link.label}
                                </Link>
                            )
                        )}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Search toggle */}
                        <button
                            onClick={toggleSearch}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                            aria-label="Toggle search"
                        >
                            <Search className="h-[18px] w-[18px]" />
                        </button>

                        {/* CTA - desktop only */}
                        <Link
                            href="/register"
                            className="hidden md:inline-flex items-center h-9 rounded-lg bg-secondary px-4 text-sm font-semibold text-white transition-colors hover:bg-secondary/90"
                        >
                            List Your Business
                        </Link>

                        {/* Mobile menu toggle */}
                        <button
                            onClick={toggleMobileMenu}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:hidden"
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-[18px] w-[18px]" />
                            ) : (
                                <Menu className="h-[18px] w-[18px]" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Search Bar (expandable) */}
                {isSearchOpen && (
                    <div className="border-t border-border bg-background px-4 py-3 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-7xl">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="search"
                                    placeholder="Search businesses, restaurants, services..."
                                    className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    autoFocus
                                />
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Mobile Menu Drawer */}
            <MobileMenu />
        </>
    );
}
