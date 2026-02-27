"use client";

import Link from "next/link";
import { useAppStore } from "@/store/appStore";
import { X } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";

export default function MobileMenu() {
    const { isMobileMenuOpen, toggleMobileMenu } = useAppStore();

    if (!isMobileMenuOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                onClick={toggleMobileMenu}
                aria-hidden="true"
            />

            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] bg-background shadow-2xl md:hidden">
                <div className="flex h-full flex-col">
                    {/* Close header */}
                    <div className="flex items-center justify-between border-b border-border px-4 py-4">
                        <span className="text-lg font-bold text-foreground">Menu</span>
                        <button
                            onClick={toggleMobileMenu}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                            aria-label="Close menu"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Nav links */}
                    <nav className="flex-1 overflow-y-auto px-2 py-4">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={toggleMobileMenu}
                                className="flex items-center rounded-lg px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-accent/50"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* CTA */}
                    <div className="border-t border-border p-4">
                        <Link
                            href="/register"
                            onClick={toggleMobileMenu}
                            className="flex w-full items-center justify-center rounded-lg bg-secondary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-secondary/90"
                        >
                            List Your Business
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
