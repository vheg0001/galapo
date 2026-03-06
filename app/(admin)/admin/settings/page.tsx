"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Settings, DollarSign, CreditCard, Search, MonitorPlay } from "lucide-react";
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";

const TABS = [
    { id: "general", label: "General", icon: Settings },
    { id: "pricing", label: "Pricing", icon: DollarSign },
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

function PricingTab({ s, set }: { s: any; set: (k: string, v: any) => void }) {
    return (
        <div className="space-y-6">
            <SectionLabel>Subscription Plans</SectionLabel>
            <div className="grid grid-cols-3 gap-4">
                <Field label="Basic Plan (₱/year)">
                    <SettingsInput type="number" value={s.price_basic ?? ""} onChange={(v) => set("price_basic", v)} placeholder="0" />
                </Field>
                <Field label="Premium Plan (₱/year)">
                    <SettingsInput type="number" value={s.price_premium ?? ""} onChange={(v) => set("price_premium", v)} placeholder="2400" />
                </Field>
                <Field label="Featured Add-on (₱/month)">
                    <SettingsInput type="number" value={s.price_featured ?? ""} onChange={(v) => set("price_featured", v)} placeholder="500" />
                </Field>
            </div>

            <SectionLabel>Claim & Reactivation</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
                <Field label="Claim Fee (₱)" hint="Fee charged to claim an existing listing.">
                    <SettingsInput type="number" value={s.price_claim ?? ""} onChange={(v) => set("price_claim", v)} placeholder="500" />
                </Field>
                <Field label="Reactivation Fee (₱)" hint="Fee to reactivate an expired listing.">
                    <SettingsInput type="number" value={s.price_reactivation ?? ""} onChange={(v) => set("price_reactivation", v)} placeholder="200" />
                </Field>
            </div>

            <SectionLabel>Ads & Promotions</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
                <Field label="Banner Ad (₱/month)">
                    <SettingsInput type="number" value={s.price_ad_banner ?? ""} onChange={(v) => set("price_ad_banner", v)} placeholder="1500" />
                </Field>
                <Field label="Top Search Slot (₱/month)">
                    <SettingsInput type="number" value={s.price_top_search ?? ""} onChange={(v) => set("price_top_search", v)} placeholder="500" />
                </Field>
            </div>
        </div>
    );
}

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
                // Parse JSON strings in settings
                const parsed: Record<string, any> = {};
                for (const key in (data.data ?? {})) {
                    const val = data.data[key];
                    try {
                        parsed[key] = typeof val === "string" ? JSON.parse(val) : val;
                    } catch {
                        parsed[key] = val;
                    }
                }
                setSettings(parsed);
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
        <div className="px-8 py-6 space-y-6">
            <div className="flex items-start justify-between">
                <AdminPageHeader
                    title="Site Settings"
                    description="Configure global settings for your GalaPo directory."
                    breadcrumbs={[{ label: "Admin" }, { label: "Settings" }]}
                />
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${saved ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"} disabled:opacity-50 hover:scale-105 active:scale-95`}
                >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-2xl bg-muted/30 p-1.5 border border-border/40 w-fit">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${activeTab === tab.id ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab content */}
            <div className="rounded-2xl border border-border/50 bg-background/40 backdrop-blur-sm p-8 shadow-sm ring-1 ring-border/30">
                {activeTab === "general" && <GeneralTab {...tabProps} />}
                {activeTab === "pricing" && <PricingTab {...tabProps} />}
                {activeTab === "payment" && <PaymentTab {...tabProps} />}
                {activeTab === "seo" && <SEOTab {...tabProps} />}
                {activeTab === "ads" && <AdsTab {...tabProps} />}
            </div>
        </div>
    );
}
