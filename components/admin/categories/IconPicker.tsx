"use client";

import { useState, useMemo } from "react";
import * as Icons from "lucide-react";
import { Search, X } from "lucide-react";

// Curated list of commonly needed business icons
const ICON_NAMES = [
    "Store", "Building2", "MapPin", "Tag", "Star", "Heart", "Phone", "Mail",
    "Globe", "Clock", "Calendar", "Camera", "Coffee", "Utensils", "UtensilsCrossed",
    "ShoppingBag", "ShoppingCart", "Car", "Truck", "Home", "Hotel", "Hospital",
    "Stethoscope", "GraduationCap", "BookOpen", "Music", "Dumbbell", "Scissors",
    "Wrench", "Hammer", "PaintBrush", "Paintbrush", "PaintBucket", "Laptop", "Monitor",
    "Wifi", "CreditCard", "DollarSign", "Banknote", "Receipt", "FileText", "Shield",
    "ShieldCheck", "Award", "Trophy", "Users", "User", "Briefcase", "Factory",
    "Warehouse", "TreePine", "Leaf", "Flame", "Zap", "Sparkles", "Crown", "Diamond",
    "Gem", "Gift", "Package", "Plane", "Ship", "Train", "Bus", "Bike", "Motorcycle",
    "Fuel", "Pizza", "Beef", "Fish", "Salad", "IceCream", "Cake", "Wine", "Beer",
    "Soup", "Sandwich", "Burger", "Baby", "Pet", "Dog", "Cat", "Flower", "Garden",
    "Church", "Mosque", "Moon", "Scale", "Gavel", "Landmark", "Library", "Theater",
    "Gamepad2", "Tv", "Aperture", "Palette", "Mic", "Radio", "Headphones", "Printer",
    "Tool", "Calculator", "HardHat", "Wheat", "Waves", "Thermometer", "Sprout",
    "Triangle", "Bug", "PartyPopper", "Smartphone", "Eye", "Tooth", "Glasses", "Pill",
    "PawPrint", "Building", "Construction", "Contact", "FastForward", "Handshake",
    "Fingerprint",
];

interface IconPickerProps {
    value?: string;
    onChange: (icon: string) => void;
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);

    const filtered = useMemo(() =>
        ICON_NAMES.filter((name) =>
            name.toLowerCase().includes(search.toLowerCase())
        ),
        [search]
    );

    const SelectedIcon = value ? (Icons as any)[value] : null;

    return (
        <div className="relative">
            <div
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/50 w-full cursor-pointer"
            >
                {SelectedIcon ? (
                    <>
                        <SelectedIcon className="h-4 w-4 text-primary shrink-0" />
                        <span>{value}</span>
                    </>
                ) : (
                    <span className="text-muted-foreground">Select Icon…</span>
                )}
                {value && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onChange(""); }}
                        className="ml-auto"
                    >
                        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                )}
            </div>

            {open && (
                <>
                    <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
                    <div className="absolute left-0 top-full z-40 mt-2 w-72 rounded-2xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-3 border-b border-border/50 flex items-center gap-2">
                            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                            <input
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                                placeholder="Search icons..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="grid grid-cols-6 gap-1 p-3 max-h-64 overflow-y-auto">
                            {filtered.map((name) => {
                                const Icon = (Icons as any)[name];
                                if (!Icon) return null;
                                return (
                                    <button
                                        key={name}
                                        type="button"
                                        title={name}
                                        onClick={() => { onChange(name); setOpen(false); }}
                                        className={`flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-muted ${value === name ? "bg-primary/10 text-primary ring-1 ring-primary/30" : "text-muted-foreground hover:text-foreground"}`}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </button>
                                );
                            })}
                            {filtered.length === 0 && (
                                <p className="col-span-6 text-center text-xs text-muted-foreground py-4">No icons found</p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
