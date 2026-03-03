"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — New Listing Page (Module 9.1)
// ──────────────────────────────────────────────────────────

import ListingWizard from "@/components/business/listings/ListingWizard";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NewListingPage() {
    return (
        <div className="min-h-screen bg-gray-50/30">
            {/* Top Navigation / Progress Summary placeholder */}
            <div className="mx-auto max-w-5xl px-4 pt-8">
                <Link
                    href="/business/listings"
                    className="group mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-400 transition hover:text-gray-900"
                >
                    <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                    Back to My Listings
                </Link>

                <div className="mb-10">
                    <h1 className="text-3xl font-black tracking-tight text-gray-900">Create New Listing</h1>
                    <p className="mt-2 text-sm text-gray-500">Reach more customers in Olongapo by listing your business today.</p>
                </div>
            </div>

            <ListingWizard />
        </div>
    );
}
