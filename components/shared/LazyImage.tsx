"use client";

import { useEffect, useRef, useState } from "react";

interface LazyImageProps {
    src: string;
    alt: string;
    placeholderSrc?: string;
    className?: string;
    width?: number | string;
    height?: number | string;
    priority?: boolean;
}

export default function LazyImage({
    src,
    alt,
    placeholderSrc = "/placeholder-business.svg",
    className = "",
    priority = false,
}: LazyImageProps) {
    const imgRef = useRef<HTMLImageElement>(null);
    const [isLoaded, setIsLoaded] = useState(priority);
    const [isInView, setIsInView] = useState(priority);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (priority) {
            setIsInView(true);
            setIsLoaded(true);
            return;
        }

        if (!imgRef.current) return;

        if (typeof IntersectionObserver === "undefined") {
            setIsInView(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            { rootMargin: "200px" }
        );
        observer.observe(imgRef.current);
        return () => observer.disconnect();
    }, [priority]);

    const handleLoad = () => {
        setIsLoaded(true);
        setHasError(false);
    };

    const handleError = () => {
        console.error("LazyImage Error for:", src);
        setHasError(true);
        setIsLoaded(false);
    };

    const opacity = (priority || (isLoaded && !hasError)) ? 1 : 0;

    return (
        <div
            className={`relative w-full h-full ${className} bg-[#f3f4f6]`}
            style={{ overflow: "hidden" }}
            data-priority={priority}
            data-has-error={hasError}
        >
            {isInView && (
                <img
                    ref={imgRef}
                    src={src}
                    alt={alt}
                    onLoad={handleLoad}
                    onError={handleError}
                    style={{
                        opacity: opacity,
                        transition: "opacity 0.4s ease-in-out",
                        objectFit: "cover",
                    }}
                    className="absolute inset-0 w-full h-full"
                    loading={priority ? "eager" : "lazy"}
                />
            )}

            {/* Placeholder / Error State */}
            {opacity === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <img
                        src={placeholderSrc}
                        alt="Placeholder"
                        className="w-12 h-12 mb-2 opacity-20"
                    />
                </div>
            )}
        </div>
    );
}
