"use client";

import { useState } from "react";
import Image from "next/image";
import ImageLightbox from "@/components/shared/ImageLightbox";

interface MenuItem {
    name: string;
    description?: string;
    price?: number;
    photo_url?: string;
}

interface MenuDisplayProps {
    items: MenuItem[];
}

function formatCurrency(val: number): string {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 0,
    }).format(val);
}

export default function MenuDisplay({ items }: MenuDisplayProps) {
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

    if (!items || items.length === 0) {
        return (
            <p className="text-sm text-muted-foreground italic">No menu items listed.</p>
        );
    }

    // Collect all items that have a photo
    const photoItems = items.filter((item) => !!item.photo_url);
    const photoUrls = photoItems.map((item) => item.photo_url as string);

    return (
        <>
            <div className="space-y-3">
                {items.map((item, index) => {
                    // Find this item's position in the photoItems array
                    const photoIndex = photoItems.findIndex((_, i) => {
                        let count = 0;
                        for (let j = 0; j <= index; j++) {
                            if (items[j].photo_url) {
                                if (j === index) return count === i;
                                count++;
                            }
                        }
                        return false;
                    });

                    return (
                        <div
                            key={index}
                            className="flex gap-4 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/30"
                        >
                            {/* Photo */}
                            {item.photo_url && (
                                <button
                                    type="button"
                                    onClick={() => setLightboxIdx(photoIndex)}
                                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted cursor-zoom-in"
                                    aria-label={`View photo of ${item.name}`}
                                >
                                    <Image
                                        src={item.photo_url}
                                        alt={item.name}
                                        fill
                                        className="object-cover transition-opacity hover:opacity-80"
                                    />
                                </button>
                            )}

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-semibold text-foreground leading-tight">{item.name}</h4>
                                    {item.price !== undefined && (
                                        <span className="shrink-0 text-sm font-bold text-primary">
                                            {formatCurrency(item.price)}
                                        </span>
                                    )}
                                </div>
                                {item.description && (
                                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                        {item.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {lightboxIdx !== null && photoUrls.length > 0 && (
                <ImageLightbox
                    images={photoUrls}
                    currentIndex={lightboxIdx}
                    onClose={() => setLightboxIdx(null)}
                    onNavigate={setLightboxIdx}
                    alt="Menu item photo"
                />
            )}
        </>
    );
}
