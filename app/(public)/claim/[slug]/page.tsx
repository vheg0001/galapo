"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — Public Claim Page (Module 9.1)
// ──────────────────────────────────────────────────────────

import { use, useEffect, useState } from "react";
import ClaimForm from "@/components/business/listings/ClaimForm";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ClaimListingPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [listing, setListing] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch basic listing info for the header (publicly available)
        async function fetchListing() {
            try {
                // In a real app, this might be a specific public "claim-data" endpoint
                // For now we use the main listing route or a mocked fetch
                const res = await fetch(`/api/listings/${slug}`);
                const data = await res.json();
                setListing(data);
            } catch (err) {
                console.error("Failed to fetch claim listing", err);
            } finally {
                setLoading(false);
            }
        }
        fetchListing();
    }, [slug]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
                <Loader2 className="animate-spin text-[#FF6B35]" size={40} />
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900">Listing Not Found</h1>
                <p className="mt-2 text-gray-500">The business you are trying to claim does not exist or has already been claimed.</p>
                <Link href="/" className="mt-6 font-bold text-[#FF6B35] hover:underline">Back to Homepage</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 px-4 py-20">
            <div className="mx-auto max-w-xl">
                <Link
                    href={`/listing/${slug}`}
                    className="mb-8 inline-flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest transition hover:text-gray-900"
                >
                    <ArrowLeft size={14} />
                    Back to Listing
                </Link>

                <ClaimForm listing={listing} />

                <div className="mt-12 text-center text-xs text-gray-400 italic">
                    <p>&copy; {new Date().getFullYear()} GalaPo — Business Verification Team</p>
                </div>
            </div>
        </div>
    );
}
