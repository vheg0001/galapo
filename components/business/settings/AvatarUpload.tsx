"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — AvatarUpload (Module 8.1)
// ──────────────────────────────────────────────────────────

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { createBrowserSupabaseClient } from "@/lib/supabase";

export default function AvatarUpload() {
    const { profile, setProfile } = useAuthStore();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const initial = profile?.full_name?.charAt(0)?.toUpperCase() ?? "?";
    const avatarUrl = profile?.avatar_url;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile?.id) return;

        // Validate
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("Image must be smaller than 5 MB.");
            return;
        }

        setUploading(true);
        setError("");

        try {
            const supabase = createBrowserSupabaseClient();
            const ext = file.name.split(".").pop();
            const path = `avatars/${profile.id}.${ext}`;

            // Upload to Supabase Storage
            const { error: uploadErr } = await supabase.storage
                .from("logos")
                .upload(path, file, { upsert: true, contentType: file.type });

            if (uploadErr) throw uploadErr;

            // Get public URL
            const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
            const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;

            // Save to profile
            const { data: updated, error: updateErr } = await supabase
                .from("profiles")
                .update({ avatar_url: publicUrl })
                .eq("id", profile.id)
                .select()
                .single();

            if (updateErr) throw updateErr;
            if (updated) setProfile(updated as any);
        } catch (err: any) {
            setError(err.message ?? "Upload failed. Please try again.");
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    return (
        <div className="flex flex-col items-center gap-3">
            {/* Avatar */}
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-gray-200 shadow-sm transition hover:border-[#FF6B35]"
            >
                {avatarUrl ? (
                    <Image
                        src={avatarUrl}
                        alt="Profile photo"
                        fill
                        className="object-cover"
                        sizes="96px"
                        priority
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#FF6B35] text-2xl font-bold text-white">
                        {initial}
                    </div>
                )}
                {/* Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                    <Camera size={20} className="text-white" />
                </div>
            </button>

            <div className="text-center">
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                    className="text-sm font-medium text-[#FF6B35] hover:underline disabled:opacity-50"
                >
                    {uploading ? "Uploading…" : "Change Photo"}
                </button>
                <p className="text-xs text-gray-400">JPG, PNG, WebP · Max 5 MB</p>
            </div>

            {error && (
                <p className="text-xs text-red-600">{error}</p>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
            />
        </div>
    );
}
