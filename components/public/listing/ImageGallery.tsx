"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import ImageLightbox from "./ImageLightbox";

interface GalleryImage {
    id: string;
    image_url: string;
    alt_text?: string | null;
    sort_order: number;
    is_primary: boolean;
}

interface ImageGalleryProps {
    images: GalleryImage[];
    businessName: string;
    categoryIcon?: string;
}

export default function ImageGallery({
    images,
    businessName,
    categoryIcon,
}: ImageGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const prev = useCallback(() => {
        setActiveIndex((i) => (i === 0 ? images.length - 1 : i - 1));
    }, [images.length]);

    const next = useCallback(() => {
        setActiveIndex((i) => (i === images.length - 1 ? 0 : i + 1));
    }, [images.length]);

    if (images.length === 0) {
        return (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-muted/60 to-muted flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground/50">
                    <span className="text-6xl">{categoryIcon || "🏢"}</span>
                    <Store className="h-8 w-8" />
                    <p className="text-sm font-medium">{businessName}</p>
                </div>
            </div>
        );
    }

    const current = images[activeIndex];

    return (
        <>
            <div className="space-y-3">
                {/* Main image */}
                <div
                    className="group relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-muted cursor-pointer"
                    onClick={() => setLightboxOpen(true)}
                >
                    <Image
                        src={current.image_url}
                        alt={current.alt_text || businessName}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                    />
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                    {/* Lightbox trigger */}
                    <button
                        onClick={() => setLightboxOpen(true)}
                        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-black/60"
                        aria-label="View full screen"
                    >
                        <ZoomIn className="h-4 w-4" />
                    </button>

                    {/* Prev / Next arrows */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={prev}
                                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-lg bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-black/60 opacity-0 group-hover:opacity-100"
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                onClick={next}
                                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-lg bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-black/60 opacity-0 group-hover:opacity-100"
                                aria-label="Next image"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                            {/* Counter */}
                            <div className="absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                                {activeIndex + 1} / {images.length}
                            </div>
                        </>
                    )}
                </div>

                {/* Thumbnail strip */}
                {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {images.map((img, i) => (
                            <button
                                key={img.id}
                                onClick={() => setActiveIndex(i)}
                                className={cn(
                                    "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                                    i === activeIndex
                                        ? "border-primary ring-2 ring-primary/20"
                                        : "border-border opacity-70 hover:opacity-100 hover:border-primary/50"
                                )}
                                aria-label={`View image ${i + 1}`}
                            >
                                <Image
                                    src={img.image_url}
                                    alt={img.alt_text || `Photo ${i + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="96px"
                                    priority={i < 4}
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightboxOpen && (
                <ImageLightbox
                    images={images}
                    initialIndex={activeIndex}
                    businessName={businessName}
                    onClose={() => setLightboxOpen(false)}
                />
            )}
        </>
    );
}
