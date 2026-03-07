"use client";

import { useEffect, useState } from "react";
import { Hash } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESETS = [
    { label: "Red", hex: "#DC2626" },
    { label: "Orange", hex: "#D97706" },
    { label: "Green", hex: "#059669" },
    { label: "Blue", hex: "#2563EB" },
    { label: "Purple", hex: "#7C3AED" },
    { label: "Pink", hex: "#EC4899" },
    { label: "Teal", hex: "#0D9488" },
    { label: "Navy", hex: "#1B2A4A" },
    { label: "Coral", hex: "#FF6B35" }
];

interface ColorPickerProps {
    value: string;
    onChange: (hex: string) => void;
    label?: string;
}

export default function ColorPicker({ value, onChange, label }: ColorPickerProps) {
    const [inputValue, setInputValue] = useState(value);

    // Sync input value with prop if changed from outside
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    const handleInputChange = (val: string) => {
        setInputValue(val);
        // Basic hex validation before propagating
        if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
            onChange(val);
        }
    };

    return (
        <div className="space-y-3">
            {label && <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">{label}</p>}

            {/* Presets Grid */}
            <div className="grid grid-cols-5 gap-1.5 p-1 rounded-xl bg-background/50 border border-border/50">
                {PRESETS.map((preset) => (
                    <button
                        key={preset.hex}
                        type="button"
                        onClick={() => onChange(preset.hex)}
                        title={preset.label}
                        className={cn(
                            "h-7 w-full rounded-lg transition-all hover:scale-110 active:scale-95 border border-white/10 shadow-sm",
                            value.toLowerCase() === preset.hex.toLowerCase() ? "ring-2 ring-primary ring-offset-2 scale-110" : "opacity-80 hover:opacity-100"
                        )}
                        style={{ backgroundColor: preset.hex }}
                    />
                ))}
            </div>

            {/* Custom Input */}
            <div className="relative group">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder="#HEXCODE"
                        className="h-9 w-full rounded-xl border border-border/50 bg-background pl-9 pr-3 text-sm font-mono focus:border-primary/50 outline-none transition-all"
                    />
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="h-9 w-10 shrink-0 cursor-pointer rounded-xl border border-border/50 bg-transparent p-0 overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
                    />
                </div>
            </div>
        </div>
    );
}

// ── Background color luminance helper ──────────────────────────────────────────
export function getLuminance(hex: string): number {
    const rgb = hex.replace(/^#/, '').match(/.{2}/g)?.map(x => parseInt(x, 16)) || [0, 0, 0];
    const [r, g, b] = rgb.map(c => {
        let v = c / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastColor(hex: string): string {
    return getLuminance(hex) > 0.4 ? "#000000" : "#FFFFFF";
}
