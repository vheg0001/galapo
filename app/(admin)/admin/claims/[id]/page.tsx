"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";
import ClaimDetailView from "@/components/admin/claims/ClaimDetailView";

export default function AdminClaimDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [claim, setClaim] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function load() {
        setLoading(true);
        const res = await fetch(`/api/admin/claims/${id}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) setError(json.error || "Failed to load claim");
        else setClaim(json);
        setLoading(false);
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    async function onAction(action: "approve" | "reject", reason?: string) {
        const res = await fetch(`/api/admin/claims/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, reason }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Action failed");
        router.push("/admin/claims");
    }

    return (
        <div className="space-y-4">
            <AdminPageHeader
                title="Claim Detail"
                breadcrumbs={[
                    { label: "Admin", href: "/admin/dashboard" },
                    { label: "Claims", href: "/admin/claims" },
                    { label: "Detail" },
                ]}
            />
            {loading && <p className="text-sm text-muted-foreground">Loading claim...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {claim && <ClaimDetailView claim={claim} onAction={onAction} />}
        </div>
    );
}
