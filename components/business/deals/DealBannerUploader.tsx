"use client";

import { useEffect, useState } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

interface DealBannerUploaderProps {
    url?: string;
    onChange: (file: File | null, previewUrl?: string) => void;
}

export default function DealBannerUploader({ url, onChange }: DealBannerUploaderProps) {
    const [preview, setPreview] = useState<string | undefined>(url);

    useEffect(() => {
        setPreview(url);
    }, [url]);

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
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Deal Banner Image</Label>
                    <p className="text-[10px] text-gray-400 mt-1">Recommended size: 1200x630px. Max 2MB.</p>
                </div>
            </div>

            <div className={`relative aspect-[16/9] w-full overflow-hidden rounded-2xl border-2 transition ${preview ? "border-primary/20 bg-white" : "border-dashed border-gray-200 bg-gray-50/50"
                }`}>
                {preview ? (
                    <>
                        <img src={preview} alt="Deal Banner" className="h-full w-full object-cover" />
                        <button
                            type="button"
                            onClick={clear}
                            className="absolute right-4 top-4 rounded-full bg-red-500 p-2 text-white shadow-lg hover:bg-red-600 transition-all hover:scale-110 active:scale-95"
                        >
                            <X size={18} />
                        </button>
                    </>
                ) : (
                    <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3 transition hover:bg-gray-100/50">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                            <Upload size={24} />
                        </div>
                        <div className="text-center">
                            <span className="block text-sm font-bold text-gray-600">Click to upload banner</span>
                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">or drag and drop</span>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={onFileSelect}
                        />
                    </label>
                )}
            </div>
        </div>
    );
}
