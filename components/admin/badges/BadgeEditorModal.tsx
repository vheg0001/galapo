"use client";

import { useState, useEffect, useMemo } from "react";
import {
    X, Sparkles, Wand2, Calculator, Info,
    Calendar, CheckCircle2, ShieldCheck,
    Smartphone, Search, ChevronRight, Zap, Star, Loader2
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Badge, BadgeType } from "@/lib/types";
import EmojiPicker from "./EmojiPicker";
import ColorPicker, { getContrastColor } from "./ColorPicker";
import BadgeLivePreview from "./BadgeLivePreview";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface BadgeEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    badge?: Badge | null;
    allBadgeSlugs: string[];
}

const COMMON_LUCIDE_ICONS = [
    "Star", "Zap", "ShieldCheck", "CheckCircle2", "Award", "Medal",
    "Trophy", "Diamond", "Gem", "Flag", "MapPin", "Compass",
    "Calendar", "Clock", "Smartphone", "Heart", "Flame",
    "Crown", "Lock", "Unlock", "UserCheck", "Store", "ShoppingBag",
    "Utensils", "Coffee", "Briefcase", "Music", "Camera", "Monitor"
];

export default function BadgeEditorModal({
    isOpen,
    onClose,
    onSave,
    badge,
    allBadgeSlugs,
}: BadgeEditorModalProps) {
    const isEdit = !!badge;
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [icon, setIcon] = useState("🏅");
    const [iconLucide, setIconLucide] = useState<string | null>(null);
    const [color, setColor] = useState("#DC2626");
    const [textColor, setTextColor] = useState("#FFFFFF");
    const [type, setType] = useState<BadgeType>("admin");
    const [priority, setPriority] = useState(50);
    const [autoExpires, setAutoExpires] = useState(false);
    const [expiryDays, setExpiryDays] = useState(30);
    const [isFilterable, setIsFilterable] = useState(true);
    const [isActive, setIsActive] = useState(true);

    const [iconTab, setIconTab] = useState<"emoji" | "lucide">("emoji");
    const [lucideSearch, setLucideSearch] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Initial load
    useEffect(() => {
        if (badge) {
            setName(badge.name);
            setSlug(badge.slug);
            setDescription(badge.description || "");
            setIcon(badge.icon || "🏅");
            setIconLucide(badge.icon_lucide || null);
            setColor(badge.color || "#DC2626");
            setTextColor(badge.text_color || "#FFFFFF");
            setType(badge.type || "admin");
            setPriority(badge.priority ?? 50);
            setAutoExpires(badge.auto_expires ?? false);
            setExpiryDays(badge.default_expiry_days ?? 30);
            setIsFilterable(badge.is_filterable ?? true);
            setIsActive(badge.is_active ?? true);
            setIconTab(badge.icon_lucide ? "lucide" : "emoji");
        } else {
            // Reset to defaults
            setName("");
            setSlug("");
            setDescription("");
            setIcon("🏅");
            setIconLucide(null);
            setColor("#DC2626");
            setTextColor("#FFFFFF");
            setType("admin");
            setPriority(50);
            setAutoExpires(false);
            setExpiryDays(30);
            setIsFilterable(true);
            setIsActive(true);
            setIconTab("emoji");
        }
    }, [badge, isOpen]);

    // Auto-generate slug
    const handleNameChange = (val: string) => {
        setName(val);
        if (!isEdit) {
            setSlug(val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
        }
    };

    // Auto-suggest text color based on background
    const handleColorChange = (hex: string) => {
        setColor(hex);
        setTextColor(getContrastColor(hex));
    };

    const filteredLucideIcons = useMemo(() => {
        const query = lucideSearch.toLowerCase();
        if (!query) return COMMON_LUCIDE_ICONS;

        // Find in all possible lucide icons (might be large, so we filter COMMON_LUCIDE_ICONS first + some extras if search matches)
        return Object.keys(LucideIcons).filter(icon =>
            icon.toLowerCase().includes(query) &&
            typeof (LucideIcons as any)[icon] === 'function' &&
            /^[A-Z]/.test(icon) // Filter out internal helpers
        ).slice(0, 48); // limit results
    }, [lucideSearch]);

    const handleSave = async () => {
        if (!name.trim()) return toast.error("Name is required");
        if (!slug.trim()) return toast.error("Slug is required");
        if (allBadgeSlugs.includes(slug)) return toast.error("Slug already exists");

        try {
            setIsSaving(true);
            const payload = {
                name,
                slug,
                description,
                icon: iconTab === "emoji" ? icon : "",
                icon_lucide: iconTab === "lucide" ? iconLucide : null,
                color,
                text_color: textColor,
                type,
                priority,
                auto_expires: autoExpires,
                default_expiry_days: autoExpires ? expiryDays : null,
                is_filterable: isFilterable,
                is_active: isActive,
            };

            const url = isEdit ? `/api/admin/badges/${badge.id}` : "/api/admin/badges";
            const method = isEdit ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to save badge");

            toast.success(isEdit ? "Badge updated" : "Badge created successfully 🏅");
            onSave();
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-[2.5rem] bg-background border border-border shadow-2xl animate-in zoom-in-95 slide-in-from-top-4 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-border/50 bg-background/50 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">
                                {isEdit ? "Edit Badge" : "Create New Badge"}
                            </h2>
                            <p className="text-xs font-medium text-muted-foreground">
                                {isEdit ? `Modifying badge: ${badge?.name}` : "Configure a new visual highlight."}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 rounded-2xl bg-secondary/30 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all active:scale-95"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto p-8 scrollbar-hide">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">

                        {/* Left Column — Form Fields */}
                        <div className="space-y-8">

                            {/* Basics Section */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 px-1">Badge Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        placeholder="e.g. Recommended"
                                        className="h-12 w-full px-4 rounded-2xl border border-border/50 bg-background/50 font-bold focus:border-primary/50 focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 px-1">Slug (Identifier)</label>
                                    <div className="relative group">
                                        <Wand2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 transition-colors group-focus-within:text-primary" />
                                        <input
                                            type="text"
                                            value={slug}
                                            onChange={(e) => setSlug(e.target.value)}
                                            placeholder="recommended-badge"
                                            className="h-12 w-full pl-11 pr-4 rounded-2xl border border-border/50 bg-background/50 font-mono text-xs focus:border-primary/50 focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 px-1">Description (Tooltip)</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Brief text shown when hovering (max 200 chars)"
                                        maxLength={200}
                                        rows={2}
                                        className="w-full p-4 rounded-2xl border border-border/50 bg-background/50 text-sm font-medium focus:border-primary/50 focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                                    />
                                </div>
                            </div>

                            {/* Icon & Color Design Section */}
                            <div className="grid grid-cols-2 gap-8 p-6 rounded-[2rem] bg-slate-50 border border-slate-100 dark:bg-slate-900/20 dark:border-slate-800/40">

                                {/* Icon Picker */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 px-1">Icon Style</label>
                                        <div className="ml-auto inline-flex rounded-lg bg-secondary/50 p-1">
                                            <button
                                                onClick={() => setIconTab("emoji")}
                                                className={cn("px-2 py-1 text-[10px] font-bold rounded-md transition-all", iconTab === "emoji" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                                            >Emoji</button>
                                            <button
                                                onClick={() => setIconTab("lucide")}
                                                className={cn("px-2 py-1 text-[10px] font-bold rounded-md transition-all", iconTab === "lucide" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                                            >Lucide</button>
                                        </div>
                                    </div>

                                    {iconTab === "emoji" ? (
                                        <EmojiPicker
                                            selected={icon}
                                            onSelect={(e) => { setIcon(e); setIconLucide(null); }}
                                        />
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                                                <input
                                                    type="text"
                                                    placeholder="Search icons..."
                                                    value={lucideSearch}
                                                    onChange={(e) => setLucideSearch(e.target.value)}
                                                    className="h-8 w-full pl-8 pr-3 text-xs rounded-lg border border-border/50 bg-background focus:border-primary/50 transition-all font-medium outline-none"
                                                />
                                            </div>
                                            <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-auto p-1 scrollbar-hide">
                                                {filteredLucideIcons.map((iconName) => {
                                                    const Icon = (LucideIcons as any)[iconName];
                                                    return (
                                                        <button
                                                            key={iconName}
                                                            type="button"
                                                            onClick={() => setIconLucide(iconName)}
                                                            title={iconName}
                                                            className={cn(
                                                                "h-9 w-9 flex items-center justify-center rounded-lg transition-all",
                                                                iconLucide === iconName ? "bg-primary text-white scale-110 shadow-lg" : "bg-background border border-border/30 hover:border-primary/30"
                                                            )}
                                                        >
                                                            {Icon && <Icon className="h-4 w-4" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Color Picker */}
                                <div className="space-y-6">
                                    <ColorPicker
                                        label="Background Color"
                                        value={color}
                                        onChange={handleColorChange}
                                    />
                                    <ColorPicker
                                        label="Text Color"
                                        value={textColor}
                                        onChange={setTextColor}
                                    />
                                </div>
                            </div>

                            {/* Configuration Section */}
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 px-1">Badge Type</label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {(["admin", "plan", "system"] as const).map((t) => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setType(t)}
                                                    disabled={isEdit && badge?.type === "plan"}
                                                    className={cn(
                                                        "flex items-center justify-between px-4 py-3 rounded-2xl border transition-all text-sm font-bold",
                                                        type === t
                                                            ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                                                            : "border-border/50 bg-background/50 text-muted-foreground hover:bg-background",
                                                        isEdit && badge?.type === "plan" && t !== "plan" && "opacity-40 cursor-not-allowed"
                                                    )}
                                                >
                                                    <span className="capitalize">{t}</span>
                                                    {type === t && <CheckCircle2 className="h-4 w-4" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4 px-1">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-1.5 font-bold text-foreground text-sm">
                                                    <Calendar className="h-4 w-4 text-emerald-500" />
                                                    Auto-Expires
                                                </div>
                                                <p className="text-[10px] text-muted-foreground">Badge expires after set days</p>
                                            </div>
                                            <button
                                                onClick={() => setAutoExpires(!autoExpires)}
                                                className={cn(
                                                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 outline-none",
                                                    autoExpires ? "bg-primary" : "bg-slate-200 dark:bg-slate-800"
                                                )}
                                            >
                                                <span className={cn(
                                                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                                                    autoExpires ? "translate-x-5 mt-0.5 ml-0" : "translate-x-0 mt-0.5 ml-0.5"
                                                )} />
                                            </button>
                                        </div>

                                        {autoExpires && (
                                            <div className="pt-2">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="number"
                                                        value={expiryDays}
                                                        onChange={(e) => setExpiryDays(parseInt(e.target.value) || 0)}
                                                        className="h-10 w-24 rounded-xl border border-border/50 bg-background px-3 font-bold text-center focus:border-primary/50 transition-all outline-none"
                                                    />
                                                    <span className="text-sm font-bold text-muted-foreground">Days until removal</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Display Priority</label>
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded cursor-help group/tip relative">
                                                <Info className="h-3 w-3" />
                                                Rank Guide
                                                <div className="absolute top-full right-0 mt-2 w-48 hidden group-hover/tip:block z-20 p-3 bg-indigo-600 text-white rounded-xl shadow-xl text-[10px] leading-relaxed animate-in fade-in zoom-in-95">
                                                    0-9: Plans<br />
                                                    10-19: Trust<br />
                                                    20-29: Status<br />
                                                    30-39: Identity<br />
                                                    40-49: Amenities
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative group">
                                            <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 transition-colors group-focus-within:text-primary" />
                                            <input
                                                type="number"
                                                value={priority}
                                                onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                                                className="h-12 w-full pl-11 pr-4 rounded-2xl border border-border/50 bg-background font-bold focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-bold text-foreground">Filterable</p>
                                                <p className="text-[10px] text-muted-foreground">Allow public search filtering</p>
                                            </div>
                                            <button
                                                onClick={() => setIsFilterable(!isFilterable)}
                                                className={cn(
                                                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 outline-none",
                                                    isFilterable ? "bg-primary" : "bg-slate-200 dark:bg-slate-800"
                                                )}
                                            >
                                                <span className={cn(
                                                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                                                    isFilterable ? "translate-x-5 mt-0.5 ml-0" : "translate-x-0 mt-0.5 ml-0.5"
                                                )} />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between px-1">
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-bold text-foreground">Is Active</p>
                                                <p className="text-[10px] text-muted-foreground">Enable system-wide usage</p>
                                            </div>
                                            <button
                                                onClick={() => setIsActive(!isActive)}
                                                className={cn(
                                                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 outline-none",
                                                    isActive ? "bg-emerald-500" : "bg-red-200 dark:bg-red-900/30"
                                                )}
                                            >
                                                <span className={cn(
                                                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                                                    isActive ? "translate-x-5 mt-0.5 ml-0" : "translate-x-0 mt-0.5 ml-0.5"
                                                )} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column — Preview & Stats */}
                        <div className="space-y-8">
                            <BadgeLivePreview
                                name={name}
                                icon={icon}
                                icon_lucide={iconLucide}
                                color={color}
                                text_color={textColor}
                            />

                            <div className="p-6 rounded-2xl border border-border/50 bg-secondary/20 space-y-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Configuration Summary</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-muted-foreground font-medium">Type:</span>
                                        <span className="font-bold text-foreground uppercase">{type}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-muted-foreground font-medium">Auto-Expires:</span>
                                        <span className={cn("font-bold", autoExpires ? "text-emerald-500" : "text-slate-400")}>{autoExpires ? `${expiryDays} Days` : "No"}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-muted-foreground font-medium">Filterable:</span>
                                        <span className={cn("font-bold", isFilterable ? "text-primary" : "text-slate-400")}>{isFilterable ? "Yes" : "No"}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-muted-foreground font-medium">Status:</span>
                                        <span className={cn("font-bold", isActive ? "text-emerald-500" : "text-red-500")}>{isActive ? "ENABLED" : "PAUSED"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-border/50 bg-background/50 backdrop-blur-xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-secondary/50 transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-10 py-2.5 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:pointer-events-none"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}
