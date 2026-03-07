"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Settings, DollarSign, CreditCard, Search, MonitorPlay, Package, Plus, Trash2, CheckCircle2, GripVertical } from "lucide-react";
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";

const TABS = [
    { id: "general", label: "General", icon: Settings },
    { id: "plans", label: "Tiers & Pricing", icon: DollarSign },
    { id: "payment", label: "Payment Info", icon: CreditCard },
    { id: "seo", label: "SEO", icon: Search },
    { id: "ads", label: "Ads", icon: MonitorPlay },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
    return <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2 mb-4">{children}</h4>;
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/80">{label}</label>
            {children}
            {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
        </div>
    );
}

function SettingsInput({ value, onChange, placeholder, type = "text" }: {
    value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
    return (
        <input
            type={type}
            className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
        />
    );
}

function SettingsTextarea({ value, onChange, placeholder, rows = 3 }: {
    value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
    return (
        <textarea
            className="w-full resize-none rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
        />
    );
}

function GeneralTab({ s, set }: { s: any; set: (k: string, v: any) => void }) {
    return (
        <div className="space-y-6">
            <SectionLabel>Site Identity</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
                <Field label="Site Name">
                    <SettingsInput value={s.site_name ?? ""} onChange={(v) => set("site_name", v)} placeholder="GalaPo" />
                </Field>
                <Field label="Site Tagline">
                    <SettingsInput value={s.site_tagline ?? ""} onChange={(v) => set("site_tagline", v)} placeholder="Discover Olongapo" />
                </Field>
            </div>
            <Field label="Site Description" hint="Shown in the footer and metadata.">
                <SettingsTextarea value={s.site_description ?? ""} onChange={(v) => set("site_description", v)} placeholder="GalaPo is the city directory for Olongapo..." />
            </Field>
            <div className="grid grid-cols-2 gap-4">
                <Field label="Contact Email">
                    <SettingsInput type="email" value={s.contact_email ?? ""} onChange={(v) => set("contact_email", v)} placeholder="hello@galapo.ph" />
                </Field>
                <Field label="Support Phone">
                    <SettingsInput type="tel" value={s.support_phone ?? ""} onChange={(v) => set("support_phone", v)} placeholder="+63 9XX XXX XXXX" />
                </Field>
            </div>

            <SectionLabel>Social Media</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
                <Field label="Facebook URL">
                    <SettingsInput value={s.facebook_url ?? ""} onChange={(v) => set("facebook_url", v)} placeholder="https://facebook.com/galapo" />
                </Field>
                <Field label="Instagram URL">
                    <SettingsInput value={s.instagram_url ?? ""} onChange={(v) => set("instagram_url", v)} placeholder="https://instagram.com/galapo" />
                </Field>
                <Field label="TikTok URL">
                    <SettingsInput value={s.tiktok_url ?? ""} onChange={(v) => set("tiktok_url", v)} placeholder="https://tiktok.com/@galapo" />
                </Field>
                <Field label="Twitter/X URL">
                    <SettingsInput value={s.twitter_url ?? ""} onChange={(v) => set("twitter_url", v)} placeholder="https://x.com/galapo" />
                </Field>
                <Field label="YouTube URL">
                    <SettingsInput value={s.youtube_url ?? ""} onChange={(v) => set("youtube_url", v)} placeholder="https://youtube.com/@galapo" />
                </Field>
            </div>

            <SectionLabel>Maintenance</SectionLabel>
            <label className="flex items-center gap-3 cursor-pointer">
                <div
                    className={`relative h-6 w-10 rounded-full transition-colors cursor-pointer ${s.maintenance_mode ? "bg-amber-500" : "bg-muted"}`}
                    onClick={() => set("maintenance_mode", !s.maintenance_mode)}
                >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${s.maintenance_mode ? "translate-x-4.5" : "translate-x-0.5"}`} />
                </div>
                <div>
                    <span className="text-sm font-medium">Maintenance Mode</span>
                    <p className="text-[11px] text-muted-foreground">Shows a maintenance page to public visitors.</p>
                </div>
            </label>
        </div>
    );
}

// Merged with PackagesTab below

function PaymentTab({ s, set }: { s: any; set: (k: string, v: any) => void }) {
    return (
        <div className="space-y-6">
            <SectionLabel>Payment Methods</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
                <Field label="GCash Number">
                    <SettingsInput value={s.gcash_number ?? ""} onChange={(v) => set("gcash_number", v)} placeholder="09XX XXX XXXX" />
                </Field>
                <Field label="GCash Account Name">
                    <SettingsInput value={s.gcash_name ?? ""} onChange={(v) => set("gcash_name", v)} placeholder="GalaPo Inc." />
                </Field>
                <Field label="Maya Number">
                    <SettingsInput value={s.maya_number ?? ""} onChange={(v) => set("maya_number", v)} placeholder="09XX XXX XXXX" />
                </Field>
                <Field label="Maya Account Name">
                    <SettingsInput value={s.maya_name ?? ""} onChange={(v) => set("maya_name", v)} placeholder="GalaPo Inc." />
                </Field>
            </div>

            <SectionLabel>Bank Transfer</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
                <Field label="Bank Name">
                    <SettingsInput value={s.bank_name ?? ""} onChange={(v) => set("bank_name", v)} placeholder="BDO Unibank" />
                </Field>
                <Field label="Account Number">
                    <SettingsInput value={s.bank_account_number ?? ""} onChange={(v) => set("bank_account_number", v)} placeholder="000 000 0000" />
                </Field>
                <Field label="Account Name">
                    <SettingsInput value={s.bank_account_name ?? ""} onChange={(v) => set("bank_account_name", v)} placeholder="GalaPo Inc." />
                </Field>
                <Field label="Branch">
                    <SettingsInput value={s.bank_branch ?? ""} onChange={(v) => set("bank_branch", v)} placeholder="Olongapo City" />
                </Field>
            </div>

            <SectionLabel>Payment Instructions</SectionLabel>
            <Field label="Instructions shown on payment upload page" hint="Supports plain text, will be shown as-is.">
                <SettingsTextarea rows={4} value={s.payment_instructions ?? ""} onChange={(v) => set("payment_instructions", v)} placeholder="Send payment via GCash or bank transfer then upload your proof of payment..." />
            </Field>
        </div>
    );
}

function SEOTab({ s, set }: { s: any; set: (k: string, v: any) => void }) {
    return (
        <div className="space-y-6">
            <SectionLabel>Default Meta Tags</SectionLabel>
            <Field label="Default Meta Title" hint="Used when page-specific title is not set.">
                <SettingsInput value={s.meta_title ?? ""} onChange={(v) => set("meta_title", v)} placeholder="GalaPo — Olongapo City Directory" />
            </Field>
            <Field label="Default Meta Description" hint="Max 160 characters recommended.">
                <SettingsTextarea value={s.meta_description ?? ""} onChange={(v) => set("meta_description", v)} placeholder="Find businesses, services, and places in Olongapo City..." />
            </Field>
            <Field label="OG Image URL" hint="Recommended: 1200×630px. Used for social sharing previews.">
                <SettingsInput type="url" value={s.og_image_url ?? ""} onChange={(v) => set("og_image_url", v)} placeholder="https://galapo.ph/og.jpg" />
            </Field>

            <SectionLabel>Scripts & Verification</SectionLabel>
            <Field label="Google Site Verification" hint="Paste the verification meta tag or just the content value.">
                <SettingsInput value={s.google_verification ?? ""} onChange={(v) => set("google_verification", v)} placeholder="xxxxx..." />
            </Field>
            <Field label="Google Analytics ID" hint="Format: G-XXXXXXXXXX">
                <SettingsInput value={s.google_analytics_id ?? ""} onChange={(v) => set("google_analytics_id", v)} placeholder="G-XXXXXXXXXX" />
            </Field>
            <Field label="Facebook Pixel ID">
                <SettingsInput value={s.facebook_pixel_id ?? ""} onChange={(v) => set("facebook_pixel_id", v)} placeholder="1234567890" />
            </Field>
        </div>
    );
}

function AdsTab({ s, set }: { s: any; set: (k: string, v: any) => void }) {
    return (
        <div className="space-y-6">
            <SectionLabel>Google AdSense</SectionLabel>
            <Field label="AdSense Publisher ID" hint="Format: ca-pub-XXXXXXXXXX">
                <SettingsInput value={s.adsense_publisher_id ?? ""} onChange={(v) => set("adsense_publisher_id", v)} placeholder="ca-pub-XXXXXXXXXX" />
            </Field>
            <Field label="Leaderboard Ad Slot (728×90)">
                <SettingsInput value={s.adsense_leaderboard_slot ?? ""} onChange={(v) => set("adsense_leaderboard_slot", v)} placeholder="1234567890" />
            </Field>
            <Field label="Sidebar Ad Slot (300×250)">
                <SettingsInput value={s.adsense_sidebar_slot ?? ""} onChange={(v) => set("adsense_sidebar_slot", v)} placeholder="1234567890" />
            </Field>

            <SectionLabel>Ad Display Settings</SectionLabel>
            <label className="flex items-center gap-3 cursor-pointer">
                <div
                    className={`relative h-6 w-10 rounded-full transition-colors cursor-pointer ${s.ads_enabled ? "bg-primary" : "bg-muted"}`}
                    onClick={() => set("ads_enabled", !s.ads_enabled)}
                >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${s.ads_enabled ? "translate-x-4.5" : "translate-x-0.5"}`} />
                </div>
                <div>
                    <span className="text-sm font-medium">Enable Ads</span>
                    <p className="text-[11px] text-muted-foreground">Toggle display of ads across the site.</p>
                </div>
            </label>
        </div>
    );
}

function PlansTab({ s, set }: { s: any; set: (k: string, v: any) => void }) {
    const packages = s.advertising_packages || [];
    const [dragIndex, setDragIndex] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    const handleDragEnd = () => {
        if (!dragIndex || !dragOverId || dragIndex === dragOverId) {
            setDragIndex(null);
            setDragOverId(null);
            return;
        }

        const fromIdx = packages.findIndex((p: any) => p.id === dragIndex);
        const toIdx = packages.findIndex((p: any) => p.id === dragOverId);

        if (fromIdx !== -1 && toIdx !== -1) {
            const newPackages = [...packages];
            const [moved] = newPackages.splice(fromIdx, 1);
            newPackages.splice(toIdx, 0, moved);
            set("advertising_packages", newPackages);
        }

        setDragIndex(null);
        setDragOverId(null);
    };

    const addPackage = () => {
        const newPkg = {
            id: Math.random().toString(36).substr(2, 9),
            name: "New Package",
            price: "500",
            interval: "/mo",
            description: "Short description",
            features: ["Feature 1", "Feature 2"],
            is_popular: false,
            button_text: "Get Started",
            button_link: "/register"
        };
        set("advertising_packages", [...packages, newPkg]);
    };

    const updatePackage = (id: string, updates: any) => {
        set("advertising_packages", packages.map((p: any) => p.id === id ? { ...p, ...updates } : p));
    };

    const removePackage = (id: string) => {
        set("advertising_packages", packages.filter((p: any) => p.id !== id));
    };

    const addFeature = (pkgId: string) => {
        const pkg = packages.find((p: any) => p.id === pkgId);
        if (pkg) {
            updatePackage(pkgId, { features: [...(pkg.features || []), "New Feature"] });
        }
    };

    const updateFeature = (pkgId: string, index: number, value: string) => {
        const pkg = packages.find((p: any) => p.id === pkgId);
        if (pkg) {
            const newFeatures = [...pkg.features];
            newFeatures[index] = value;
            updatePackage(pkgId, { features: newFeatures });
        }
    };

    const removeFeature = (pkgId: string, index: number) => {
        const pkg = packages.find((p: any) => p.id === pkgId);
        if (pkg) {
            updatePackage(pkgId, { features: pkg.features.filter((_: any, i: number) => i !== index) });
        }
    };

    return (
        <div className="space-y-12">
            {/* Tiers Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border/40 pb-4">
                    <div>
                        <SectionLabel>Public Tiers & Packages</SectionLabel>
                        <p className="text-[11px] text-muted-foreground -mt-3">These appear on your /pricing and /advertise pages.</p>
                    </div>
                    <button
                        onClick={addPackage}
                        type="button"
                        className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add Tier
                    </button>
                </div>

                <div className="grid gap-6">
                    {packages.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 rounded-3xl border-2 border-dashed border-border/50 bg-muted/20">
                            <Package className="h-10 w-10 text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground font-medium">No tiers defined yet.</p>
                            <button onClick={addPackage} className="mt-4 text-xs font-bold text-primary hover:underline">Add your first pricing tier</button>
                        </div>
                    )}
                    {packages.map((p: any) => (
                        <div
                            key={p.id}
                            draggable
                            onDragStart={() => setDragIndex(p.id)}
                            onDragOver={(e) => { e.preventDefault(); setDragOverId(p.id); }}
                            onDragEnd={handleDragEnd}
                            className={`group relative rounded-3xl border-2 p-6 transition-all bg-background/50 ${p.is_popular ? "border-primary/40 shadow-sm ring-1 ring-primary/10" : "border-border/50 shadow-none hover:border-border"} ${dragOverId === p.id && dragIndex !== p.id ? "border-t-primary border-t-4" : ""} ${dragIndex === p.id ? "opacity-40" : ""}`}
                        >
                            <div className="absolute left-1/2 -top-3 hidden group-hover:flex items-center justify-center -translate-x-1/2 bg-muted/80 rounded-full px-2 py-0.5 border border-border/50 cursor-grab active:cursor-grabbing shadow-sm z-20">
                                <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>

                            <div className="absolute -right-3 -top-3 hidden group-hover:block transition-all z-20">
                                <button
                                    onClick={() => removePackage(p.id)}
                                    className="rounded-full bg-red-500 p-2 text-white shadow-lg hover:bg-red-600 active:scale-95 transition-all"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="grid gap-8 lg:grid-cols-12">
                                <div className="lg:col-span-5 space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Tier Name">
                                            <SettingsInput value={p.name} onChange={(v) => updatePackage(p.id, { name: v })} placeholder="e.g. Featured Listing" />
                                        </Field>
                                        <Field label="Price">
                                            <div className="relative">
                                                <span className="absolute left-3 top-2 text-sm text-muted-foreground font-bold">₱</span>
                                                <input
                                                    className="w-full rounded-xl border border-border/50 bg-background/50 pl-7 pr-3 py-2 text-sm outline-none transition-all focus:border-primary/50"
                                                    value={p.price}
                                                    onChange={(e) => updatePackage(p.id, { price: e.target.value })}
                                                />
                                            </div>
                                        </Field>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Interval">
                                            <SettingsInput value={p.interval} onChange={(v) => updatePackage(p.id, { interval: v })} placeholder="/mo or /year" />
                                        </Field>
                                        <label className="flex items-center gap-2 mt-7 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={p.is_popular}
                                                onChange={(e) => updatePackage(p.id, { is_popular: e.target.checked })}
                                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                            />
                                            <span className="text-xs font-bold text-foreground/80">Highlight as Popular</span>
                                        </label>
                                    </div>
                                    <Field label="Short Description">
                                        <SettingsInput value={p.description} onChange={(v) => updatePackage(p.id, { description: v })} placeholder="Recommended for local businesses" />
                                    </Field>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Button Text">
                                            <SettingsInput value={p.button_text} onChange={(v) => updatePackage(p.id, { button_text: v })} placeholder="Get Started" />
                                        </Field>
                                        <Field label="Button Link">
                                            <SettingsInput value={p.button_link} onChange={(v) => updatePackage(p.id, { button_link: v })} placeholder="/register" />
                                        </Field>
                                    </div>
                                </div>

                                <div className="lg:col-span-1 border-r border-border/30 hidden lg:block" />

                                <div className="lg:col-span-6 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Included Perks</label>
                                        <button onClick={() => addFeature(p.id)} className="text-[10px] font-bold text-primary hover:underline">+ Add Perk</button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {p.features?.map((feat: string, fIdx: number) => (
                                            <div key={fIdx} className="flex items-center gap-2">
                                                <div className="flex-1 flex items-center gap-2 bg-muted/20 rounded-lg px-3 py-1.5 border border-border/20">
                                                    <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                                                    <input
                                                        className="flex-1 bg-transparent border-none outline-none text-xs"
                                                        value={feat}
                                                        onChange={(e) => updateFeature(p.id, fIdx, e.target.value)}
                                                    />
                                                </div>
                                                <button onClick={() => removeFeature(p.id, fIdx)} className="text-muted-foreground hover:text-red-500 transition-colors">
                                                    <Trash2 className="h-4 w-4 shrink-0" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fees Section */}
            <div className="space-y-6 pt-6 border-t border-border/40">
                <SectionLabel>Administrative Fees & Promo Placement</SectionLabel>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <Field label="Claim Fee (₱)" hint="Fee to claim a listing.">
                        <SettingsInput type="number" value={s.price_claim ?? ""} onChange={(v) => set("price_claim", v)} placeholder="500" />
                    </Field>
                    <Field label="Reactivation Fee (₱)" hint="Fee for expired listings.">
                        <SettingsInput type="number" value={s.reactivation_fee_amount ?? ""} onChange={(v) => set("reactivation_fee_amount", v)} placeholder="200" />
                    </Field>
                    <Field label="Top Search Slot (₱/mo)" hint="Premium search placement.">
                        <SettingsInput type="number" value={s.top_search_monthly_price ?? ""} onChange={(v) => set("top_search_monthly_price", v)} placeholder="500" />
                    </Field>
                </div>
            </div>
        </div>
    );
}

export default function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState("general");
    const [settings, setSettings] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetch("/api/admin/settings")
            .then((r) => r.json())
            .then((data) => {
                setSettings(data.data ?? {});
                setLoading(false);
            });
    }, []);

    function set(key: string, value: any) {
        setSettings((prev) => ({ ...prev, [key]: value }));
    }

    async function handleSave() {
        setSaving(true);
        setSaved(false);
        const res = await fetch("/api/admin/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(settings),
        });
        setSaving(false);
        if (res.ok) {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } else {
            alert("Failed to save settings");
        }
    }

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const tabProps = { s: settings, set };

    return (
        <div className="px-4 py-4 sm:px-8 sm:py-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <AdminPageHeader
                    title="Site Settings"
                    description="Configure global settings for your GalaPo directory."
                    breadcrumbs={[{ label: "Admin" }, { label: "Settings" }]}
                />
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${saved ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"} disabled:opacity-50 hover:scale-105 active:scale-95 w-full sm:w-auto`}
                >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
                </button>
            </div>

            {/* Tabs */}
            <div className="overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                <div className="flex gap-1 rounded-2xl bg-muted/30 p-1.5 border border-border/40 min-w-max sm:w-fit">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all shrink-0 ${activeTab === tab.id ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab content */}
            <div className="rounded-2xl border border-border/50 bg-background/40 backdrop-blur-sm p-8 shadow-sm ring-1 ring-border/30">
                {activeTab === "general" && <GeneralTab {...tabProps} />}
                {activeTab === "plans" && <PlansTab {...tabProps} />}
                {activeTab === "payment" && <PaymentTab {...tabProps} />}
                {activeTab === "seo" && <SEOTab {...tabProps} />}
                {activeTab === "ads" && <AdsTab {...tabProps} />}
            </div>
        </div>
    );
}
