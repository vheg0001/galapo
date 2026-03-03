"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — LogoUploader Component (Module 9.1)
// ──────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";

interface LogoUploaderProps {
    url?: string;
    onChange: (file: File | null, url?: string) => void;
}

export default function LogoUploader({ url, onChange }: LogoUploaderProps) {
    const [preview, setPreview] = useState<string | undefined>(url);

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);
        onChange(file, previewUrl);
    };

    const clear = () => {
        if (preview && preview.startsWith("blob:")) {
            URL.revokeObjectURL(preview);
        }
        setPreview(undefined);
        onChange(null);
    };

    return (
        <div className="flex items-center gap-6">
            <div className={`relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 transition ${preview ? "border-[#FF6B35]/20 bg-white" : "border-dashed border-gray-200 bg-gray-50"
                }`}>
                {preview ? (
                    <img src={preview} alt="Business Logo" className="h-full w-full object-contain p-2" />
                ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-gray-300">
                        <ImageIcon size={32} />
                        <span className="mt-1 text-[10px] font-bold uppercase tracking-wider">Logo</span>
                    </div>
                )}
                {preview && (
                    <button
                        type="button"
                        onClick={clear}
                        className="absolute -right-0 -top-0 rounded-bl-xl bg-red-500 p-1.5 text-white shadow-sm hover:bg-red-600 transition"
                    >
                        <X size={12} />
                    </button>
                )}
            </div>

            <div className="flex-1 space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">Business Logo</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                    Upload your official business logo. Square or transparent PNG works best. Max 2MB.
                </p>
                <div className="flex">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-200">
                        <Upload size={14} />
                        {preview ? "Change Logo" : "Upload Logo"}
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={onFileSelect}
                        />
                    </label>
                </div>
            </div>
        </div>
    );
}
