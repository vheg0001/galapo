"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — MenuItemBuilder Component (Module 9.1)
// ──────────────────────────────────────────────────────────

import { useState } from "react";
import { Plus, Trash2, GripVertical, Image as ImageIcon, X, Loader2 } from "lucide-react";
import type { MenuItemValue } from "@/store/listingFormStore";

interface MenuItemBuilderProps {
    items: MenuItemValue[];
    onChange: (items: MenuItemValue[]) => void;
    listingId?: string; // When provided, uploads happen immediately on file pick
}

export default function MenuItemBuilder({ items, onChange, listingId }: MenuItemBuilderProps) {
    const [uploadingId, setUploadingId] = useState<string | null>(null);

    const addItem = () => {
        const newItem: MenuItemValue = {
            id: crypto.randomUUID(),
            name: "",
            description: "",
            price: "",
        };
        onChange([...items, newItem]);
    };

    const updateItem = (id: string, patch: Partial<MenuItemValue>) => {
        onChange(items.map(item => item.id === id ? { ...item, ...patch } : item));
    };

    const removeItem = (id: string) => {
        onChange(items.filter(item => item.id !== id));
    };

    const handlePhotoUpload = async (id: string, file: File) => {
        if (!listingId) {
            // No listing ID yet: keep as local blob preview, will be synced on submit
            const previewUrl = URL.createObjectURL(file);
            updateItem(id, { photo_url: previewUrl });
            return;
        }

        setUploadingId(id);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(`/api/business/listings/${listingId}/upload-asset`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");
            const data = await res.json();

            updateItem(id, { photo_url: data.url });
        } catch (error) {
            console.error("Photo upload error:", error);
            alert("Failed to upload photo. Please try again.");
        } finally {
            setUploadingId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Menu / Item List</h3>
                <span className="text-xs text-gray-400">{items.length} items added</span>
            </div>

            <div className="space-y-3">
                {items.map((item, idx) => (
                    <div key={item.id} className="group relative flex gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-[#FF6B35]/30">
                        {/* Drag Handle (Visual only for now) */}
                        <div className="flex cursor-grab items-center text-gray-300 hover:text-gray-400">
                            <GripVertical size={18} />
                        </div>

                        {/* Photo column */}
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                            {uploadingId === item.id ? (
                                <div className="flex h-full w-full items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : item.photo_url ? (
                                <>
                                    <img src={item.photo_url} alt={item.name} className="h-full w-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => updateItem(item.id, { photo_url: undefined })}
                                        className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition group-hover:opacity-100"
                                    >
                                        <X size={10} />
                                    </button>
                                </>
                            ) : (
                                <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 transition hover:bg-gray-100">
                                    <ImageIcon size={20} className="text-gray-300" />
                                    <span className="text-[10px] text-gray-400">Add Photo</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handlePhotoUpload(item.id, file);
                                        }}
                                    />
                                </label>
                            )}
                        </div>

                        {/* Inputs column */}
                        <div className="flex flex-1 flex-col gap-2">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Item name (e.g. Adobo)"
                                    value={item.name}
                                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                                    className="flex-1 rounded-md border-gray-100 bg-gray-50/50 px-2.5 py-1.5 text-sm font-medium focus:border-[#FF6B35] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/20"
                                />
                                <div className="relative w-32">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₱</span>
                                    <input
                                        type="number"
                                        placeholder="Price"
                                        value={item.price}
                                        onChange={(e) => updateItem(item.id, { price: e.target.value })}
                                        className="w-full rounded-md border-gray-100 bg-gray-50/50 pl-6 pr-2.5 py-1.5 text-sm focus:border-[#FF6B35] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/20"
                                    />
                                </div>
                            </div>
                            <textarea
                                placeholder="Short description (optional)"
                                value={item.description}
                                onChange={(e) => updateItem(item.id, { description: e.target.value })}
                                className="w-full resize-none rounded-md border-gray-100 bg-gray-50/50 px-2.5 py-1.5 text-xs text-gray-600 focus:border-[#FF6B35] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/20"
                                rows={2}
                            />
                        </div>

                        {/* Delete button */}
                        <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition self-start"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={addItem}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-4 text-sm font-medium text-gray-500 transition hover:border-[#FF6B35] hover:bg-[#FF6B35]/5 hover:text-[#FF6B35]"
                >
                    <Plus size={18} />
                    Add Menu Item
                </button>
            </div>
        </div>
    );
}
