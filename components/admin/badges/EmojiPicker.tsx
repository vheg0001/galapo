"use client";

import { useState } from "react";
import { Search } from "lucide-react";

const EMOJIS = [
    // Medals & Badges
    "🏅", "🎖️", "🏆", "🥇", "🥈", "🥉", "💎", "⭐", "🌟", "✨", "🔥", "🔝", "💯", "🎗️", "🎫", "👑", "🎖",
    // Trust & Security
    "🛡️", "✅", "✔️", "🆗", "🉐", "🔒", "🔓", "🔍", "🤝", "👤", "👮", "⚖️", "🆕", "🆒", "🆙", "🔔", "📣",
    // Business & Services
    "🏢", "🏪", "🏥", "🏫", "🏩", "🏨", "🏦", "🏗️", "🏠", "🏡", "🛒", "💳", "🏷️", "📦", "🚚", "🛠️", "⚙️", "💡", "📞", "✉️",
    // Food & Dining
    "🍔", "🍕", "🌮", "🥘", "🥗", "🍣", "🍜", "🍦", "🍰", "☕", "🥨", "🥯", "🥞", "🥪", "🥟", "🍱", "🧁", "🍫", "🍿", "🥤", "🍺", "🥂", "🥃",
    // Health & Wellness
    "⚕️", "💊", "🧴", "🧼", "🦷", "🧖", "🧘", "🏋️", "🚶", "🚴", "🏊", "🧼", "💆",
    // Travel & Outdoor
    "✈️", "🚗", "🚕", "🚌", "🏎️", "🚢", "⚓", "🗺️", "⛱️", "🏖️", "🌊", "🏞️", "🏕️", "⛰️", "🌴", "🌳", "🌵", "📍", "🚩",
    // Entertainment & Tech
    "🎨", "🎬", "🎸", "🎮", "⚽", "🏀", "💻", "📱", "🔋", "🔌", "📡", "📸", "🎧", "🎤", "🎥", "📺",
    // Lifestyle & Shopping
    "🎓", "👗", "👠", "🕶️", "💄", "💍", "🐾", "🐶", "🐱", "🐰", "🦊", "🐻", "🐼", "🛍️", "🎁", "🎈", "🎉",
    // Symbols & Time
    "🕒", "📅", "⏳", "⌛", "♻️", "✅", "❌", "🚫", "⚠️", "⚡", "🌈", "☀️", "🌙", "⭐", "💫"
];

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    selected?: string;
}

export default function EmojiPicker({ onSelect, selected }: EmojiPickerProps) {
    const [search, setSearch] = useState("");

    const filtered = EMOJIS.filter(e => e.includes(search)); // Simple search for demo, though emojis don't have text descriptions in this list

    return (
        <div className="space-y-3">
            <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                <input
                    type="text"
                    placeholder="Search emojis..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 w-full pl-7 pr-3 text-xs rounded-lg border border-border/50 bg-background outline-none focus:border-primary/50 transition-all font-medium"
                />
            </div>

            <div className="grid grid-cols-8 gap-1 max-h-48 overflow-auto p-1 scrollbar-hide">
                {EMOJIS.map((emoji, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => onSelect(emoji)}
                        className={`h-9 w-9 flex items-center justify-center rounded-lg text-xl transition-all hover:scale-110 active:scale-90 ${selected === emoji ? "bg-primary text-white scale-110 shadow-lg" : "hover:bg-secondary/50"
                            }`}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
}
