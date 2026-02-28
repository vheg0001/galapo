"use client";

import Image from "next/image";

interface MenuItem {
    name: string;
    description?: string;
    price?: number;
    photo?: string;
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
    if (!items || items.length === 0) {
        return (
            <p className="text-sm text-muted-foreground italic">No menu items listed.</p>
        );
    }

    return (
        <div className="space-y-3">
            {items.map((item, index) => (
                <div
                    key={index}
                    className="flex gap-4 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/30"
                >
                    {/* Photo */}
                    {item.photo && (
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                            <Image
                                src={item.photo}
                                alt={item.name}
                                fill
                                className="object-cover"
                            />
                        </div>
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
            ))}
        </div>
    );
}
