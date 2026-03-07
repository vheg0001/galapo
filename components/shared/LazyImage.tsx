"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface LazyImageProps {
    src: string;
    alt: string;
    placeholderSrc?: string;
    className?: string;
    priority?: boolean;
    unoptimized?: boolean;
    sizes?: string;
}

export default function LazyImage({
    src,
    alt,
    placeholderSrc = "/placeholder-business.svg",
    className = "",
    priority = false,
    unoptimized,
    sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
}: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Light gray solid color as blur placeholder
    const imgBlur = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+";

    const displaySrc = (hasError || !src) ? placeholderSrc : src;

    // Auto-unoptimize external placeholders to avoid 400 errors from next/image optimization
    const shouldUnoptimize = unoptimized ?? (displaySrc?.includes("placehold.co") || displaySrc?.endsWith(".svg"));

    return (
        <div className={cn("relative h-full w-full overflow-hidden bg-muted", className)}>
            <Image
                src={displaySrc}
                alt={alt}
                fill
                priority={priority}
                unoptimized={shouldUnoptimize}
                sizes={sizes}
                className={cn(
                    "object-cover transition-all duration-500",
                    isLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-105 blur-sm"
                )}
                onLoad={() => setIsLoaded(true)}
                onError={() => {
                    setHasError(true);
                    setIsLoaded(true); // Stop loading state
                }}
                placeholder="blur"
                blurDataURL={imgBlur}
            />

            {!isLoaded && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-foreground/5" />
                </div>
            )}
        </div>
    );
}
