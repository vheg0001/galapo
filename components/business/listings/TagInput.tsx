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
            className="min-h-[44px] flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-white p-2 cursor-text focus-within:border-[#FF6B35] focus-within:ring-1 focus-within:ring-[#FF6B35]/20 transition"
            onClick={() => inputRef.current?.focus()}
        >
            {tags.map((tag) => (
                <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-[#FF6B35]/10 px-2.5 py-0.5 text-sm font-medium text-[#FF6B35]"
                >
                    {tag}
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                        className="hover:text-red-500 transition"
                    >
                        <X size={12} />
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
                    className="flex-1 min-w-[120px] bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none"
                />
            )}
            {tags.length >= maxTags && (
                <span className="text-xs text-gray-400 self-center">Max {maxTags} tags</span>
            )}
        </div>
    );
}
