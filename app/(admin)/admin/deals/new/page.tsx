"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";
import DealForm from "@/components/business/deals/DealForm";
import { Loader2 } from "lucide-react";

export default function AdminNewDealPage() {
    const searchParams = useSearchParams();
    const listingId = searchParams.get("listing_id");

    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadListings() {
            try {
                // Fetch all approved listings for the super admin to choose from
                const res = await fetch("/api/admin/listings?status=approved&limit=1000");
                const json = await res.json();
                setListings(json.data || []);
            } catch (err) {
                console.error("Failed to load listings", err);
            } finally {
                setLoading(false);
            }
        }
        loadListings();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Create New Deal"
                breadcrumbs={[
                    { label: "Admin", href: "/admin/dashboard" },
                    { label: "Deals & Offers", href: "/admin/deals" },
                    { label: "New Deal" }
                ]}
            />

            <div className="max-w-5xl mx-auto">
                <DealForm
                    listings={listings}
                    initialData={listingId ? { listing_id: listingId } : undefined}
                />
            </div>
        </div>
    );
}
