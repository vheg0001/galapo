"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Facebook, Instagram, Youtube } from "lucide-react";
import {
    APP_NAME,
    APP_TAGLINE,
    FOOTER_QUICK_LINKS,
    FOOTER_BUSINESS_LINKS,
    FOOTER_LEGAL_LINKS,
} from "@/lib/constants";

interface FooterProps {
    settings?: Record<string, any>;
}

export default function Footer({ settings = {} }: FooterProps) {
    const siteName = settings.site_name || APP_NAME;
    const siteTagline = settings.site_tagline || APP_TAGLINE;
    const facebookUrl = settings.facebook_url;
    const instagramUrl = settings.instagram_url;
    const tiktokUrl = settings.tiktok_url;
    const twitterUrl = settings.twitter_url;
    const youtubeUrl = settings.youtube_url;

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
                                {siteName}
                            </span>
                        </div>
                        <p className="text-sm text-primary-foreground/70">
                            {siteTagline}. Your ultimate city business directory for Olongapo
                            City, Philippines.
                        </p>
                        {/* Social icons */}
                        <div className="flex items-center gap-3 pt-2">
                            {facebookUrl && (
                                <a
                                    href={facebookUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/10 text-primary-foreground/70 transition-colors hover:bg-secondary hover:text-white"
                                    aria-label="Facebook"
                                >
                                    <Facebook className="h-4 w-4" />
                                </a>
                            )}
                            {instagramUrl && (
                                <a
                                    href={instagramUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/10 text-primary-foreground/70 transition-colors hover:bg-secondary hover:text-white"
                                    aria-label="Instagram"
                                >
                                    <Instagram className="h-4 w-4" />
                                </a>
                            )}
                            {tiktokUrl && (
                                <a
                                    href={tiktokUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/10 text-primary-foreground/70 transition-colors hover:bg-secondary hover:text-white"
                                    aria-label="TikTok"
                                >
                                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a8.776 8.776 0 0 1-1.87-1.35v6.52c-.03 2.14-.54 4.41-2.12 5.92-1.58 1.51-3.9 2.1-6.11 1.83-2.2-.27-4.2-1.4-5.35-3.23-1.15-1.83-1.29-4.15-.38-6.07.91-1.92 2.8-3.32 4.93-3.69v4.03c-1.14.19-2.14.86-2.61 1.9-.47 1.04-.32 2.3.41 3.2.73.9 1.95 1.34 3.09 1.13 1.14-.21 2.05-1.12 2.22-2.27.03-1.8-.02-3.61.02-5.42.01-4.03 0-8.06.01-12.09z"></path></svg>
                                </a>
                            )}
                            {twitterUrl && (
                                <a
                                    href={twitterUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/10 text-primary-foreground/70 transition-colors hover:bg-secondary hover:text-white"
                                    aria-label="X (Twitter)"
                                >
                                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                                </a>
                            )}
                            {youtubeUrl && (
                                <a
                                    href={youtubeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/10 text-primary-foreground/70 transition-colors hover:bg-secondary hover:text-white"
                                    aria-label="YouTube"
                                >
                                    <Youtube className="h-4 w-4" />
                                </a>
                            )}
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
                        &copy; {currentYear} {siteName}. All rights reserved.
                    </p>
                    <div className="flex items-center gap-3">
                        {facebookUrl && (
                            <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="text-primary-foreground/50 hover:text-secondary transition-colors" aria-label="Facebook">
                                <Facebook className="h-4 w-4" />
                            </a>
                        )}
                        {instagramUrl && (
                            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-primary-foreground/50 hover:text-secondary transition-colors" aria-label="Instagram">
                                <Instagram className="h-4 w-4" />
                            </a>
                        )}
                        {tiktokUrl && (
                            <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="text-primary-foreground/50 hover:text-secondary transition-colors" aria-label="TikTok">
                                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a8.776 8.776 0 0 1-1.87-1.35v6.52c-.03 2.14-.54 4.41-2.12 5.92-1.58 1.51-3.9 2.1-6.11 1.83-2.2-.27-4.2-1.4-5.35-3.23-1.15-1.83-1.29-4.15-.38-6.07.91-1.92 2.8-3.32 4.93-3.69v4.03c-1.14.19-2.14.86-2.61 1.9-.47 1.04-.32 2.3.41 3.2.73.9 1.95 1.34 3.09 1.13 1.14-.21 2.05-1.12 2.22-2.27.03-1.8-.02-3.61.02-5.42.01-4.03 0-8.06.01-12.09z"></path></svg>
                            </a>
                        )}
                        {twitterUrl && (
                            <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="text-primary-foreground/50 hover:text-secondary transition-colors" aria-label="X (Twitter)">
                                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                            </a>
                        )}
                        {youtubeUrl && (
                            <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-primary-foreground/50 hover:text-secondary transition-colors" aria-label="YouTube">
                                <Youtube className="h-4 w-4" />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </footer>
    );
}
