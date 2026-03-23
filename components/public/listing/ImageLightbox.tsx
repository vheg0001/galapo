"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { createPortal } from "react-dom";

interface LightboxImage {
    id: string;
    image_url: string;
    alt_text?: string | null;
}

interface ImageLightboxProps {
    images: LightboxImage[];
    initialIndex?: number;
    businessName: string;
    onClose: () => void;
}

export default function ImageLightbox({
    images,
    initialIndex = 0,
    businessName,
    onClose,
}: ImageLightboxProps) {
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    const prev = useCallback(() => {
        setActiveIndex((i) => (i === 0 ? images.length - 1 : i - 1));
    }, [images.length]);

    const next = useCallback(() => {
        setActiveIndex((i) => (i === images.length - 1 ? 0 : i + 1));
    }, [images.length]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose, prev, next]);

    if (!mounted) return null;

    const current = images[activeIndex];

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Close button */}
            <button
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                onClick={onClose}
                aria-label="Close lightbox"
            >
                <X className="h-5 w-5" />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur-sm">
                {activeIndex + 1} / {images.length}
            </div>

            {/* Main Image */}
            <div className="relative flex items-center justify-center h-full w-full px-16 pointer-events-none">
                <div className="relative w-full h-full max-h-[85vh] max-w-[90vw] pointer-events-auto">
                    <Image
                        src={current.image_url}
                        alt={current.alt_text || `${businessName} - Photo ${activeIndex + 1}`}
                        fill
                        className="object-contain"
                        priority
                        sizes="100vw"
                    />
                </div>
            </div>

            {/* Prev / Next */}
            {images.length > 1 && (
                <>
                    <button
                        className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                        onClick={prev}
                        aria-label="Previous image"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                        onClick={next}
                        aria-label="Next image"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </>
            )}

            {/* Thumbnail row */}
            {images.length > 1 && (
                <div
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[80vw] px-4 pb-1"
                >
                    {images.map((img, i) => (
                        <button
                            key={img.id}
                            onClick={() => setActiveIndex(i)}
                            className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-lg transition-all ${i === activeIndex
                                ? "ring-2 ring-white opacity-100"
                                : "opacity-50 hover:opacity-80"
                                }`}
                        >
                            <Image
                                src={img.image_url}
                                alt={`Thumbnail ${i + 1}`}
                                fill
                                className="object-cover"
                                sizes="64px"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>,
        document.body
    );
}
