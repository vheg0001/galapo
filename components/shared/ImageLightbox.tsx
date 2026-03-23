"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageLightboxProps {
    images: string[];
    currentIndex: number;
    onClose: () => void;
    onNavigate: (index: number) => void;
    alt?: string;
}

export default function ImageLightbox({
    images,
    currentIndex,
    onClose,
    onNavigate,
    alt = "Image",
}: ImageLightboxProps) {
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < images.length - 1;

    const handlePrev = useCallback(() => {
        if (hasPrev) onNavigate(currentIndex - 1);
    }, [currentIndex, hasPrev, onNavigate]);

    const handleNext = useCallback(() => {
        if (hasNext) onNavigate(currentIndex + 1);
    }, [currentIndex, hasNext, onNavigate]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") handlePrev();
            if (e.key === "ArrowRight") handleNext();
        };
        window.addEventListener("keydown", handleKey);
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", handleKey);
            document.body.style.overflow = "";
        };
    }, [onClose, handlePrev, handleNext]);

    const currentSrc = images[currentIndex];

    return (
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Close"
            >
                <X className="h-5 w-5" />
            </button>

            {/* Prev button */}
            {hasPrev && (
                <button
                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
                    aria-label="Previous image"
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>
            )}

            {/* Image */}
            <div
                className="relative max-h-[90vh] max-w-[90vw] w-full h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={currentSrc}
                    alt={alt}
                    className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
                />
            </div>

            {/* Next button */}
            {hasNext && (
                <button
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
                    aria-label="Next image"
                >
                    <ChevronRight className="h-6 w-6" />
                </button>
            )}

            {/* Dot indicators */}
            {images.length > 1 && (
                <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
                    {images.map((_, i) => (
                        <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); onNavigate(i); }}
                            className={`h-2 rounded-full transition-all ${i === currentIndex ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
                                }`}
                            aria-label={`Go to image ${i + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Counter */}
            {images.length > 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-4 py-1.5 text-xs font-bold text-white/80 backdrop-blur-sm">
                    {currentIndex + 1} / {images.length}
                </div>
            )}
        </div>
    );
}
