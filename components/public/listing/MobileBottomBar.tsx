"use client";

import { Phone, Navigation, Share2 } from "lucide-react";
import { useState } from "react";
import { trackContactClick } from "@/lib/analytics";
import { AnalyticsEventType } from "@/lib/types";

interface MobileBottomBarProps {
    phone?: string | null;
    lat?: number | null;
    lng?: number | null;
    businessName: string;
    url: string;
    listingSlug: string;
}

export default function MobileBottomBar({
    phone,
    lat,
    lng,
    businessName,
    url,
    listingSlug,
}: MobileBottomBarProps) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        if (typeof navigator !== "undefined" && navigator.share) {
            try {
                await navigator.share({ title: businessName, url });
                trackContactClick(listingSlug, AnalyticsEventType.SHARE, { method: "web_share" });
                return;
            } catch {
                // User cancelled or not supported
            }
        }
        // Fallback: copy to clipboard
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            trackContactClick(listingSlug, AnalyticsEventType.SHARE, { method: "clipboard" });
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // ignore
        }
    };

    const googleMapsUrl = lat && lng
        ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
        : null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md shadow-lg lg:hidden">
            <div className="flex items-center divide-x divide-border">
                {/* Call button */}
                {phone ? (
                    <a
                        href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                        className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-medium text-foreground transition-colors hover:bg-accent active:bg-accent/80"
                        aria-label={`Call ${businessName}`}
                        onClick={() => trackContactClick(listingSlug, AnalyticsEventType.PHONE_CLICK, { value: phone, source: "mobile_bar" })}
                    >
                        <Phone className="h-5 w-5 text-primary" />
                        <span>Call</span>
                    </a>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-medium text-muted-foreground/40 cursor-not-allowed">
                        <Phone className="h-5 w-5" />
                        <span>Call</span>
                    </div>
                )}

                {/* Directions button */}
                {googleMapsUrl ? (
                    <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-medium text-foreground transition-colors hover:bg-accent active:bg-accent/80"
                        aria-label="Get directions"
                        onClick={() => trackContactClick(listingSlug, AnalyticsEventType.DIRECTIONS_CLICK, { source: "mobile_bar" })}
                    >
                        <Navigation className="h-5 w-5 text-primary" />
                        <span>Directions</span>
                    </a>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-medium text-muted-foreground/40 cursor-not-allowed">
                        <Navigation className="h-5 w-5" />
                        <span>Directions</span>
                    </div>
                )}

                {/* Share button */}
                <button
                    onClick={handleShare}
                    className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-medium text-foreground transition-colors hover:bg-accent active:bg-accent/80"
                    aria-label="Share"
                >
                    <Share2 className="h-5 w-5 text-primary" />
                    <span>{copied ? "Copied!" : "Share"}</span>
                </button>
            </div>
        </div>
    );
}
