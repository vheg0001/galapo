"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — NotificationPreferences (Module 8.1)
// ──────────────────────────────────────────────────────────

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { createBrowserSupabaseClient } from "@/lib/supabase";

const PREFERENCE_ITEMS = [
    {
        key: "listing_approved",
        label: "Listing Approvals & Rejections",
        description: "Get notified when your listing is reviewed",
    },
    {
        key: "subscription_expiry",
        label: "Subscription Expiry",
        description: "Remind me before my plan expires",
    },
    {
        key: "annual_check",
        label: "Annual Check Reminders",
        description: "Be alerted for your yearly listing verification",
    },
    {
        key: "payment_confirmed",
        label: "Payment Confirmations",
        description: "Receive confirmations for transactions",
    },
];

interface Prefs {
    listing_approved: boolean;
    subscription_expiry: boolean;
    annual_check: boolean;
    payment_confirmed: boolean;
    [key: string]: boolean;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] ${checked ? "bg-[#FF6B35]" : "bg-gray-200"
                }`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ${checked ? "translate-x-5" : "translate-x-0"
                    }`}
            />
        </button>
    );
}

export default function NotificationPreferences() {
    const { profile, setProfile } = useAuthStore();

    const defaultPrefs: Prefs = {
        listing_approved: true,
        subscription_expiry: true,
        annual_check: true,
        payment_confirmed: true,
        ...(profile?.notification_preferences ?? {}),
    };

    const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    const toggle = (key: string) =>
        setPrefs((p) => ({ ...p, [key]: !p[key] }));

    const handleSave = async () => {
        if (!profile?.id) return;
        setSaving(true);
        setStatus("idle");
        try {
            const supabase = createBrowserSupabaseClient();
            const { data, error } = await supabase
                .from("profiles")
                .update({ notification_preferences: prefs })
                .eq("id", profile.id)
                .select()
                .single();
            if (error) throw error;
            if (data) setProfile(data as any);
            setStatus("success");
            setTimeout(() => setStatus("idle"), 3000);
        } catch {
            setStatus("error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {PREFERENCE_ITEMS.map((item) => (
                    <div key={item.key} className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4">
                        <div>
                            <p className="text-sm font-medium text-gray-900">{item.label}</p>
                            <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>
                        </div>
                        <Toggle
                            checked={prefs[item.key]}
                            onChange={() => toggle(item.key)}
                        />
                    </div>
                ))}
            </div>

            {status === "success" && (
                <div className="rounded-lg bg-green-50 border border-green-100 px-4 py-3 text-sm font-medium text-green-700">
                    ✅ Preferences saved.
                </div>
            )}
            {status === "error" && (
                <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-700">
                    ❌ Failed to save preferences.
                </div>
            )}

            <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-[#FF6B35] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e55a25] disabled:opacity-50"
            >
                {saving ? "Saving…" : "Save Preferences"}
            </button>
        </div>
    );
}
