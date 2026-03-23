"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";
import DealForm from "@/components/business/deals/DealForm";
import { Loader2, AlertCircle } from "lucide-react";

export default function AdminEditDealPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [deal, setDeal] = useState<any>(null);
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                // 1. Fetch the deal
                const dealRes = await fetch(`/api/admin/deals/${id}`);
                const dealJson = await dealRes.json();
                if (!dealRes.ok) throw new Error(dealJson.error || "Failed to load deal");
                setDeal(dealJson.data);

                // 2. Fetch listings for the dropdown
                const listingsRes = await fetch("/api/admin/listings?status=approved&limit=1000");
                const listingsJson = await listingsRes.json();
                setListings(listingsJson.data || []);
            } catch (err: any) {
                console.error("Failed to load edit data", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        if (id) loadData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !deal) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-6 text-red-600 max-w-md border border-red-100 shadow-sm">
                    <AlertCircle className="h-6 w-6 shrink-0" />
                    <p className="font-bold">{error || "Deal not found"}</p>
                </div>
                <button
                    onClick={() => router.push("/admin/deals")}
                    className="text-sm font-bold text-primary hover:underline"
                >
                    Back to Deals Management
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Edit Deal"
                breadcrumbs={[
                    { label: "Admin", href: "/admin/dashboard" },
                    { label: "Deals & Offers", href: "/admin/deals" },
                    { label: "Edit Deal" }
                ]}
            />

            <div className="max-w-5xl mx-auto pb-20">
                <DealForm
                    listings={listings}
                    initialData={deal}
                    isEditing={true}
                />
            </div>
        </div>
    );
}
