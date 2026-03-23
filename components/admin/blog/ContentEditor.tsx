"use client";

import { useRef, useState } from "react";
import RichTextEditor from "@/components/admin/pages/RichTextEditor";
import InsertListingModal from "@/components/admin/blog/InsertListingModal";
import type { BlogLinkedListing } from "@/lib/types";

interface ContentEditorProps {
    value: string;
    linkedListings: BlogLinkedListing[];
    onChange: (value: string) => void;
    onLinkedListingsChange: (listings: BlogLinkedListing[]) => void;
}

export default function ContentEditor({ value, linkedListings, onChange, onLinkedListingsChange }: ContentEditorProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleListingSelect = (listing: BlogLinkedListing) => {
        const exists = linkedListings.some((item) => item.id === listing.id);
        if (!exists) {
            onLinkedListingsChange([...linkedListings, listing]);
        }

        onChange(
            `${value}<div data-linked-listing-id="${listing.id}"><p><strong>Mentioned business:</strong> ${listing.business_name}</p></div>`
        );
    };

    const handleImageUpload = async (file?: File | null) => {
        if (!file) return;
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/admin/blog/upload-image", {
            method: "POST",
            body: formData,
        });
        const payload = await response.json();
        if (response.ok && payload.url) {
            onChange(`${value}<p><img src="${payload.url}" alt="Blog image" /></p>`);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    Insert Listing
                </button>
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                    Upload Image
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleImageUpload(event.target.files?.[0] || null)}
                />
            </div>

            <RichTextEditor value={value} onChange={onChange} placeholder="Write your article here..." minHeight="520px" />

            <InsertListingModal open={modalOpen} onClose={() => setModalOpen(false)} onSelect={handleListingSelect} />
        </div>
    );
}