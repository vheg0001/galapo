"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SlotRow } from "./SlotRow";
import * as LucideIcons from "lucide-react";

export function CategorySlotCard({
    categoryGroup,
    onUpdated
}: {
    categoryGroup: any;
    onUpdated: () => void;
}) {
    const { category, slots } = categoryGroup;
    
    // Dynamically render the lucide icon
    // @ts-ignore
    const Icon = category.icon && LucideIcons[category.icon] ? LucideIcons[category.icon] : LucideIcons.Folder;

    return (
        <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center gap-3 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mt-0.5">
                        /{category.slug}
                    </p>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {slots.map((slot: any) => (
                    <SlotRow 
                        key={`${category.id}-${slot.position}`}
                        categoryId={category.id}
                        categoryName={category.name}
                        slot={slot}
                        onUpdated={onUpdated}
                    />
                ))}
            </CardContent>
        </Card>
    );
}
