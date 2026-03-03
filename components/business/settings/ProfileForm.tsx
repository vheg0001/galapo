"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — ProfileForm (Module 8.1)
// ──────────────────────────────────────────────────────────

import { useState } from "react";
import { User, Phone, Mail } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { createBrowserSupabaseClient } from "@/lib/supabase";

export default function ProfileForm() {
    const { profile, setProfile } = useAuthStore();
    const [fullName, setFullName] = useState(profile?.full_name ?? "");
    const [phone, setPhone] = useState(profile?.phone ?? "");
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.id) return;
        setSaving(true);
        setStatus("idle");

        try {
            const supabase = createBrowserSupabaseClient();
            const { data, error } = await supabase
                .from("profiles")
                .update({ full_name: fullName.trim(), phone: phone.trim() })
                .eq("id", profile.id)
                .select()
                .single();

            if (error) throw error;
            if (data) setProfile(data as any);
            setStatus("success");
            setTimeout(() => setStatus("idle"), 3000);
        } catch (err: any) {
            setErrorMsg(err.message ?? "Failed to update profile.");
            setStatus("error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full Name
                </label>
                <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        required
                        className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 transition"
                    />
                </div>
            </div>

            {/* Email (read-only) */}
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email <span className="text-xs text-gray-400">(cannot be changed)</span>
                </label>
                <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                    <input
                        id="email"
                        type="email"
                        value={profile?.email ?? ""}
                        readOnly
                        className="w-full rounded-lg border border-gray-100 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-400 cursor-not-allowed"
                    />
                </div>
            </div>

            {/* Phone */}
            <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number
                </label>
                <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="09171234567"
                        className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 transition"
                    />
                </div>
            </div>

            {/* Status Messages */}
            {status === "success" && (
                <div className="rounded-lg bg-green-50 border border-green-100 px-4 py-3 text-sm font-medium text-green-700">
                    ✅ Profile updated successfully.
                </div>
            )}
            {status === "error" && (
                <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-700">
                    ❌ {errorMsg}
                </div>
            )}

            <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-[#FF6B35] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e55a25] disabled:opacity-50"
            >
                {saving ? "Saving…" : "Save Changes"}
            </button>
        </form>
    );
}
