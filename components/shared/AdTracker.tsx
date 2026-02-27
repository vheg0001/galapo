"use client";

import { useEffect, useRef, useState } from "react";

interface AdTrackerProps {
    adId: string;
    children: React.ReactNode;
}

export default function AdTracker({ adId, children }: AdTrackerProps) {
    const trackerRef = useRef<HTMLDivElement>(null);
    const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

    useEffect(() => {
        if (hasTrackedImpression || !trackerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // Track impression
                        fetch("/api/ads", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ad_id: adId }),
                        }).catch(console.error);

                        setHasTrackedImpression(true);
                        observer.disconnect();
                    }
                });
            },
            { threshold: 0.5 } // Track when at least 50% visible
        );

        observer.observe(trackerRef.current);

        return () => observer.disconnect();
    }, [adId, hasTrackedImpression]);

    const handleTrackClick = () => {
        // Track click (fire and forget)
        fetch("/api/ads/click", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ad_id: adId }),
        }).catch(console.error);
    };

    return (
        <div ref={trackerRef} onClick={handleTrackClick}>
            {children}
        </div>
    );
}
