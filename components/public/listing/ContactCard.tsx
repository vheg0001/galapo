"use client";

import { Phone, Mail, Globe, Navigation, Facebook, Instagram, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackContactClick } from "@/lib/analytics";
import { AnalyticsEventType } from "@/lib/types";

interface ContactCardProps {
    phone?: string | null;
    phoneSecondary?: string | null;
    email?: string | null;
    website?: string | null;
    socialLinks?: {
        facebook?: string;
        instagram?: string;
        tiktok?: string;
        [key: string]: string | undefined;
    } | null;
    lat?: number | null;
    lng?: number | null;
    businessName: string;
    listingSlug: string;
}

function TikTokIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.19a8.19 8.19 0 004.79 1.52V6.27a4.85 4.85 0 01-1.02-.58z" />
        </svg>
    );
}

export default function ContactCard({
    phone,
    phoneSecondary,
    email,
    website,
    socialLinks,
    lat,
    lng,
    businessName,
    listingSlug,
}: ContactCardProps) {
    const hasDirections = lat && lng;
    const googleMapsUrl = hasDirections
        ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
        : null;

    const hasSocial = socialLinks && (socialLinks.facebook || socialLinks.instagram || socialLinks.tiktok);

    const btnClass = "group flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3.5 text-sm font-medium transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm";
    const iconClass = "h-4.5 w-4.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary";

    return (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-md">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Contact</h3>

            <div className="space-y-2">
                {/* Primary phone */}
                {phone && (
                    <a
                        href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                        className={btnClass}
                        onClick={() => trackContactClick(listingSlug, AnalyticsEventType.PHONE_CLICK, { value: phone })}
                    >
                        <Phone className={cn(iconClass, "text-primary")} />
                        <div className="min-w-0">
                            <p className="truncate text-foreground">{phone}</p>
                            <p className="text-[10px] text-muted-foreground">Tap to call</p>
                        </div>
                    </a>
                )}

                {/* Secondary phone */}
                {phoneSecondary && (
                    <a
                        href={`tel:${phoneSecondary.replace(/[^0-9+]/g, "")}`}
                        className={btnClass}
                        onClick={() => trackContactClick(listingSlug, AnalyticsEventType.PHONE_CLICK, { value: phoneSecondary, type: "secondary" })}
                    >
                        <Phone className={iconClass} />
                        <div className="min-w-0">
                            <p className="truncate text-foreground">{phoneSecondary}</p>
                            <p className="text-[10px] text-muted-foreground">Alternative</p>
                        </div>
                    </a>
                )}

                {/* Email */}
                {email && (
                    <a
                        href={`mailto:${email}`}
                        className={btnClass}
                        onClick={() => trackContactClick(listingSlug, AnalyticsEventType.EMAIL_CLICK, { value: email })}
                    >
                        <Mail className={iconClass} />
                        <span className="truncate text-foreground">{email}</span>
                    </a>
                )}

                {/* Website */}
                {website && (
                    <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={btnClass}
                        onClick={() => trackContactClick(listingSlug, AnalyticsEventType.WEBSITE_CLICK, { value: website })}
                    >
                        <Globe className={iconClass} />
                        <span className="truncate text-foreground">Visit Website</span>
                        <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                    </a>
                )}

                {/* Directions */}
                {googleMapsUrl && (
                    <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(btnClass, "border-primary/20 bg-primary/5 hover:bg-primary/10")}
                        onClick={() => trackContactClick(listingSlug, AnalyticsEventType.DIRECTIONS_CLICK)}
                    >
                        <Navigation className="h-4 w-4 shrink-0 text-primary" />
                        <span className="font-semibold text-primary">Get Directions</span>
                    </a>
                )}
            </div>

            {/* Social links */}
            {hasSocial && (
                <div className="border-t border-border pt-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Follow on Social</p>
                    <div className="flex gap-2">
                        {socialLinks?.facebook && (
                            <a
                                href={socialLinks.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                                aria-label="Facebook"
                            >
                                <Facebook className="h-4 w-4" />
                            </a>
                        )}
                        {socialLinks?.instagram && (
                            <a
                                href={socialLinks.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-pink-400 hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-pink-900/20"
                                aria-label="Instagram"
                            >
                                <Instagram className="h-4 w-4" />
                            </a>
                        )}
                        {socialLinks?.tiktok && (
                            <a
                                href={socialLinks.tiktok}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-white/10 dark:hover:text-white"
                                aria-label="TikTok"
                            >
                                <TikTokIcon className="h-4 w-4" />
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
