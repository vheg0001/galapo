"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Facebook, Instagram } from "lucide-react";
import {
    APP_NAME,
    APP_TAGLINE,
    FOOTER_QUICK_LINKS,
    FOOTER_BUSINESS_LINKS,
    FOOTER_LEGAL_LINKS,
} from "@/lib/constants";

export default function Footer() {
    const pathname = usePathname();
    const currentYear = new Date().getFullYear();

    const handleHomeClick = (e: React.MouseEvent) => {
        if (pathname === "/") {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    return (
        <footer className="border-t border-border bg-primary text-primary-foreground">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-white">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">
                                {APP_NAME}
                            </span>
                        </div>
                        <p className="text-sm text-primary-foreground/70">
                            {APP_TAGLINE}. Your ultimate city business directory for Olongapo
                            City, Philippines.
                        </p>
                        {/* Social icons */}
                        <div className="flex items-center gap-3 pt-2">
                            <a
                                href="https://facebook.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/10 text-primary-foreground/70 transition-colors hover:bg-secondary hover:text-white"
                                aria-label="Facebook"
                            >
                                <Facebook className="h-4 w-4" />
                            </a>
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/10 text-primary-foreground/70 transition-colors hover:bg-secondary hover:text-white"
                                aria-label="Instagram"
                            >
                                <Instagram className="h-4 w-4" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/80">
                            Quick Links
                        </h3>
                        <ul className="space-y-2">
                            {FOOTER_QUICK_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        onClick={link.href === "/" ? handleHomeClick : undefined}
                                        className="text-sm text-primary-foreground/70 transition-colors hover:text-secondary"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* For Businesses */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/80">
                            For Business
                        </h3>
                        <ul className="space-y-2">
                            {FOOTER_BUSINESS_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-primary-foreground/70 transition-colors hover:text-secondary"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/80">
                            Legal
                        </h3>
                        <ul className="space-y-2">
                            {FOOTER_LEGAL_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-primary-foreground/70 transition-colors hover:text-secondary"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-10 border-t border-primary-foreground/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-primary-foreground/50">
                        &copy; {currentYear} {APP_NAME}. All rights reserved.
                    </p>
                    <div className="flex items-center gap-3">
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/50 hover:text-secondary transition-colors" aria-label="Facebook">
                            <Facebook className="h-4 w-4" />
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/50 hover:text-secondary transition-colors" aria-label="Instagram">
                            <Instagram className="h-4 w-4" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
