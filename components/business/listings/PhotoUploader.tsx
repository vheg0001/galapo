"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — PhotoUploader Component (Module 9.1)
// ──────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import { Camera, X, Plus, Image as ImageIcon, Loader2 } from "lucide-react";

interface ListingPhoto {
    id: string;
    url: string;
    isPrimary?: boolean;
    file?: File;
}

interface PhotoUploaderProps {
    photos: ListingPhoto[];
    onChange: (photos: ListingPhoto[]) => void;
    maxPhotos?: number;
}

export default function PhotoUploader({ photos, onChange, maxPhotos = 10 }: PhotoUploaderProps) {
    const [uploading, setUploading] = useState<string | null>(null);

    const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newPhotos: ListingPhoto[] = files.map(file => ({
            id: crypto.randomUUID(),
            url: URL.createObjectURL(file),
            file,
            isPrimary: photos.length === 0 // First photo is primary by default
        }));

        onChange([...photos, ...newPhotos].slice(0, maxPhotos));
    }, [photos, onChange, maxPhotos]);

    const removePhoto = (id: string) => {
        const removed = photos.find(p => p.id === id);
        if (removed?.url.startsWith("blob:")) {
            URL.revokeObjectURL(removed.url);
        }
        const filtered = photos.filter(p => p.id !== id);
        // Ensure one remains primary
        if (removed?.isPrimary && filtered.length > 0) {
            filtered[0].isPrimary = true;
        }
        onChange(filtered);
    };

    const setPrimary = (id: string) => {
        const index = photos.findIndex(p => p.id === id);
        if (index === -1) return;

        const updatedPhotos = [...photos];
        const [selectedPhoto] = updatedPhotos.splice(index, 1);

        // Update isPrimary flags
        const finalPhotos = [
            { ...selectedPhoto, isPrimary: true },
            ...updatedPhotos.map(p => ({ ...p, isPrimary: false }))
        ];

        onChange(finalPhotos);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-gray-700">Gallery Photos</h3>
                    <p className="text-xs text-gray-400">Add up to {maxPhotos} photos. First photo is usually the cover.</p>
                </div>
                <span className="text-xs font-medium text-gray-500">{photos.length} / {maxPhotos}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {photos.map((photo) => (
                    <div
                        key={photo.id}
                        className={`group relative aspect-square overflow-hidden rounded-xl border-2 transition ${photo.isPrimary ? "border-[#FF6B35]" : "border-gray-100"
                            }`}
                    >
                        <img src={photo.url} alt="Gallery" className="h-full w-full object-cover" />

                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 transition group-hover:opacity-100 flex flex-col items-center justify-center gap-2">
                            {!photo.isPrimary && (
                                <button
                                    type="button"
                                    onClick={() => setPrimary(photo.id)}
                                    className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold text-gray-800 hover:bg-white"
                                >
                                    Set as Cover
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => removePhoto(photo.id)}
                                className="rounded-full bg-red-500/90 p-1.5 text-white hover:bg-red-50"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {photo.isPrimary && (
                            <div className="absolute left-2 top-2 rounded-md bg-[#FF6B35] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                                COVER
                            </div>
                        )}
                    </div>
                ))}

                {photos.length < maxPhotos && (
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 transition hover:border-[#FF6B35] hover:bg-[#FF6B35]/5 text-gray-400 hover:text-[#FF6B35]">
                        <div className="flex flex-col items-center">
                            <Plus size={24} />
                            <span className="mt-1 text-xs font-medium">Add Photos</span>
                        </div>
                        <input
                            type="file"
                            multiple
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
