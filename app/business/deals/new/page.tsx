import { createServerSupabaseClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import DealForm from "@/components/business/deals/DealForm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewDealPage() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch user's listings to select from
    const { data: listings } = await supabase
        .from("listings")
        .select("id, business_name, is_premium, is_featured")
        .eq("owner_id", user.id)
        .eq("status", "approved");

    if (!listings || listings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-6 h-20 w-20 flex items-center justify-center rounded-3xl bg-amber-50 text-amber-500">
                    <AlertCircle className="h-10 w-10" />
                </div>
                <h2 className="text-xl font-black text-gray-900">No Approved Listings</h2>
                <p className="mt-2 text-sm text-gray-500 max-w-xs">
                    You need at least one approved business listing to create deals and offers.
                </p>
                <Link href="/business/listings" className="mt-8 font-bold text-[#FF6B35] hover:underline">
                    Manage your listings →
                </Link>
            </div>
        );
    }

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
                    <h1 className="text-3xl font-black tracking-tight text-gray-900">Create New Deal</h1>
                    <p className="mt-1 text-sm text-gray-500">Fill in the details below to publish your special offer.</p>
                </div>
            </div>

            <DealForm listings={listings} />
        </div>
    );
}

function AlertCircle({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    );
}
