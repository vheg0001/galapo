"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — TagInput Component (Module 9.1)
// ──────────────────────────────────────────────────────────

import { useState, useRef, KeyboardEvent } from "react";
import { X } from "lucide-react";

interface TagInputProps {
    tags: string[];
    onChange: (tags: string[]) => void;
    maxTags?: number;
    placeholder?: string;
}

export default function TagInput({
    tags,
    onChange,
    maxTags = 10,
    placeholder = "Press Enter to add a tag",
}: TagInputProps) {
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const addTag = (value: string) => {
        const trimmed = value.trim().toLowerCase();
        if (!trimmed || tags.includes(trimmed) || tags.length >= maxTags) return;
        onChange([...tags, trimmed]);
        setInput("");
    };

    const removeTag = (tag: string) => {
        onChange(tags.filter((t) => t !== tag));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addTag(input);
        } else if (e.key === "Backspace" && !input && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
        }
    };

    return (
        <div
            className="min-h-[48px] flex flex-wrap gap-2 rounded-2xl border border-border/50 bg-background px-4 py-2 cursor-text focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5 transition-all shadow-sm"
            onClick={() => inputRef.current?.focus()}
        >
            {tags.map((tag) => (
                <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary ring-1 ring-primary/20"
                >
                    {tag}
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                        className="hover:text-primary-foreground hover:bg-primary rounded-full p-0.5 transition-all"
                    >
                        <X size={10} />
                    </button>
                </span>
            ))}
            {tags.length < maxTags && (
                <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => input.trim() && addTag(input)}
                    placeholder={tags.length === 0 ? placeholder : ""}
                    className="flex-1 min-w-[140px] bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground outline-none"
                />
            )}
            {tags.length >= maxTags && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 self-center">
                    Max {maxTags} tags
                </span>
            )}
        </div>
    );
}
