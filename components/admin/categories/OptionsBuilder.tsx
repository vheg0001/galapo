"use client";

import { useState } from "react";
import { Plus, X, GripVertical } from "lucide-react";

interface OptionsBuilderProps {
    options: string[];
    onChange: (options: string[]) => void;
}

export default function OptionsBuilder({ options, onChange }: OptionsBuilderProps) {
    const [input, setInput] = useState("");
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    function addOption() {
        const val = input.trim();
        if (!val || options.includes(val)) return;
        onChange([...options, val]);
        setInput("");
    }

    function removeOption(idx: number) {
        onChange(options.filter((_, i) => i !== idx));
    }

    function onDragEnd() {
        if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
            const reordered = [...options];
            const [moved] = reordered.splice(dragIndex, 1);
            reordered.splice(dragOverIndex, 0, moved);
            onChange(reordered);
        }
        setDragIndex(null);
        setDragOverIndex(null);
    }

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <input
                    className="flex-1 rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                    placeholder="Type option and press Enter..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
                />
                <button
                    type="button"
                    onClick={addOption}
                    className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                    <Plus className="h-3.5 w-3.5" /> Add
                </button>
            </div>

            {options.length > 0 && (
                <div className="space-y-1.5">
                    {options.map((opt, i) => (
                        <div
                            key={i}
                            draggable
                            onDragStart={() => setDragIndex(i)}
                            onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i); }}
                            onDragEnd={onDragEnd}
                            className={`flex items-center gap-2 rounded-lg border border-border/30 bg-muted/30 px-3 py-1.5 transition-all ${dragOverIndex === i && dragIndex !== i ? "border-primary/50 bg-primary/5" : ""}`}
                        >
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 cursor-grab active:cursor-grabbing" />
                            <span className="flex-1 text-sm">{opt}</span>
                            <button type="button" onClick={() => removeOption(i)}>
                                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500 transition-colors" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {options.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">No options yet. Add at least one option.</p>
            )}
        </div>
    );
}
