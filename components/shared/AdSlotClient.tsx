"use client";

import { useEffect, useState } from "react";
import LazyImage from "./LazyImage";
import Link from "next/link";
import AdTracker from "./AdTracker";

interface AdSlotClientProps {
    location: string;
    position?: number;
    className?: string;
    priority?: boolean;
}

interface AdData {
    id: string;
    title: string;
    image_url: string;
    target_url: string;
}

export default function AdSlotClient({ location, position = 1, className, priority }: AdSlotClientProps) {
    const [ad, setAd] = useState<AdData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function fetchAd() {
            try {
                const res = await fetch(`/api/ads?location=${location}&position=${position}`);
                const { data } = await res.json();
                if (isMounted) {
                    setAd(data);
                    setIsLoading(false);
                }
            } catch (err) {
                console.error("Failed to fetch ad:", err);
                if (isMounted) setIsLoading(false);
            }
        }

        fetchAd();
        return () => { isMounted = false; };
    }, [location, position]);

    if (isLoading) {
        // Shimmer/Skeleton placeholder
        return (
            <div className={`animate-pulse bg-muted rounded-xl h-[90px] w-full max-w-3xl mx-auto ${className}`} />
        );
    }

    if (!ad?.image_url || !ad.target_url) {
        return null;
    }

    return (
        <div className={className}>
            <AdTracker adId={ad.id}>
                <Link
                    href={ad.target_url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="block overflow-hidden rounded-xl"
                >
                    <LazyImage
                        src={ad.image_url}
                        alt={ad.title || "Advertisement"}
                        width={728}
                        height={90}
                        className="mx-auto w-full max-w-3xl aspect-[728/90]"
                        priority={priority}
                    />
                </Link>
            </AdTracker>
        </div>
    );
}
