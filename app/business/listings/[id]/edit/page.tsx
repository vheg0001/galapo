"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — Edit Listing Page (Module 9.1)
// ──────────────────────────────────────────────────────────

import { use } from "react";
import ListingWizard from "@/components/business/listings/ListingWizard";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    return (
        <div className="min-h-screen bg-gray-50/30">
            <div className="mx-auto max-w-5xl px-4 pt-8">
                <Link
                    href="/business/listings"
                    className="group mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-400 transition hover:text-gray-900"
                >
                    <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                    Back to My Listings
                </Link>

                <div className="mb-10">
                    <h1 className="text-3xl font-black tracking-tight text-gray-900">Edit Listing</h1>
                    <p className="mt-2 text-sm text-gray-500">Update your business information and gallery.</p>
                </div>
            </div>

            <ListingWizard listingId={id} />
        </div>
    );
}
