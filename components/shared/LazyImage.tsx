"use client";

import { useEffect, useRef, useState } from "react";

interface LazyImageProps {
    src: string;
    alt: string;
    placeholderSrc?: string; // optional low‑res placeholder or solid color URL
    className?: string;
    width?: number | string;
    height?: number | string;
    priority?: boolean;
    // any other img props can be spread via ...rest if needed
}

export default function LazyImage({
    src,
    alt,
    placeholderSrc = "/placeholder-business.svg",
    className = "",
    width,
    height,
    priority = false,
}: LazyImageProps) {
    const imgRef = useRef<HTMLImageElement>(null);
    const [isLoaded, setIsLoaded] = useState(priority);
    const [isInView, setIsInView] = useState(priority);

    useEffect(() => {
        if (priority || !imgRef.current) return;
        // Guard for environments without IntersectionObserver (e.g., Jest, SSR)
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
    }, []);

    const handleLoad = () => setIsLoaded(true);

    const imgStyle: React.CSSProperties = {
        transition: "opacity 0.4s ease-in-out",
        opacity: isLoaded ? 1 : 0,
        objectFit: "cover",
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
    };

    const placeholderStyle: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        backgroundImage: `url(${placeholderSrc})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        transition: "opacity 0.4s ease-in-out",
        opacity: isLoaded ? 0 : 1,
    };

    return (
        <div className={`relative ${className}`} style={{ overflow: "hidden" }}>
            <img
                ref={imgRef}
                src={isInView ? src : placeholderSrc}
                alt={alt}
                onLoad={handleLoad}
                style={imgStyle}
                className="absolute inset-0 w-full h-full"
            />
            <div style={placeholderStyle} aria-hidden="true" />
        </div>
    );
}
