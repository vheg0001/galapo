import { createServerSupabaseClient } from "@/lib/supabase";
import { notFound, redirect } from "next/navigation";
import DealForm from "@/components/business/deals/DealForm";
import { ChevronLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EditDealPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch deal and verify ownership
    const { data: deal, error: dealError } = await supabase
        .from("deals")
        .select("*, listing:listings(owner_id, business_name, is_premium, is_featured)")
        .eq("id", id)
        .single();

    if (dealError || !deal || deal.listing.owner_id !== user.id) {
        notFound();
    }

    // Fetch all user's listings for the dropdown
    const { data: listings } = await supabase
        .from("listings")
        .select("id, business_name, is_premium, is_featured")
        .eq("owner_id", user.id)
        .eq("status", "approved");

    return (
        <div className="mx-auto max-w-6xl space-y-8 p-6 lg:p-10">
            <div className="flex items-center gap-4">
                <Link
                    href="/business/deals"
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-400 transition hover:bg-gray-50 hover:text-gray-900"
                >
                    <ChevronLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900">Edit Deal</h1>
                    <p className="mt-1 text-sm text-gray-500">Update your offer details below.</p>
                </div>
            </div>

            <DealForm listings={listings || []} initialData={deal} isEditing={true} />
        </div>
    );
}
