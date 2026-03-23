"use client";

import { useState, useCallback } from "react";
import { Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlogImageUploaderProps {
    value: string;
    onChange: (url: string) => void;
    className?: string;
}

export default function BlogImageUploader({ value, onChange, className }: BlogImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please select an image file.");
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/admin/blog/upload-image", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Upload failed");
            }

            onChange(data.url);
        } catch (err: any) {
            setError(err.message || "Failed to upload image. Please try again.");
        } finally {
            setUploading(false);
        }
    }, [onChange]);

    const handleRemove = () => {
        onChange("");
    };

    return (
        <div className={cn("space-y-2", className)}>
            <div
                className={cn(
                    "relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all",
                    value 
                        ? "border-transparent bg-muted/50" 
                        : "border-border bg-background hover:bg-muted/30 hover:border-primary/50",
                    error && "border-red-500 bg-red-500/5"
                )}
            >
                {value ? (
                    <>
                        <img 
                            src={value} 
                            alt="Featured preview" 
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100">
                            <div className="flex gap-2">
                                <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-lg hover:bg-white">
                                    <Upload size={18} />
                                    <input type="file" className="hidden" accept="image/*" onChange={onFileSelect} disabled={uploading} />
                                </label>
                                <button
                                    type="button"
                                    onClick={handleRemove}
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/90 text-white shadow-lg hover:bg-red-600"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3">
                        {uploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <span className="text-sm font-medium text-muted-foreground">Uploading...</span>
                            </div>
                        ) : (
                            <>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <ImageIcon size={24} />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold">Click to upload featured image</p>
                                    <p className="text-xs text-muted-foreground">PNG, JPG or WebP (max. 5MB)</p>
                                </div>
                            </>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={onFileSelect} disabled={uploading} />
                    </label>
                )}
            </div>
            
            {error && <p className="text-xs font-medium text-red-500">{error}</p>}
            
            {value && (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-2 text-[10px] font-mono font-medium text-muted-foreground shadow-sm">
                    <span className="truncate flex-1">{value}</span>
                </div>
            )}
        </div>
    );
}
