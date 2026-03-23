import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase";
import PaymentReview from "@/components/admin/payments/PaymentReview";
import { CreditCard } from "lucide-react";

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    return {
        title: `Verify Payment ${id.substring(0, 8)} | Admin | GalaPo`,
    };
}

export default async function AdminPaymentDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = createAdminSupabaseClient();

    const { data: payment, error } = await supabase
        .from("payments")
        .select(`
            *,
            profiles:user_id (id, full_name, email, phone, avatar_url),
            listings:listing_id (id, business_name, slug, logo_url, is_featured, is_premium),
            subscriptions:subscription_id (id, plan_type, status, start_date, end_date)
        `)
        .eq("id", id)
        .single();

    if (error || !payment) {
        notFound();
    }

    return (
        <div className="flex flex-col gap-6 p-6 md:p-8 max-w-7xl mx-auto w-full min-h-screen">
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">
                    <CreditCard className="h-3 w-3" />
                    <span>Transaction Review</span>
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                    Payment Review
                </h1>
            </div>

            <PaymentReview payment={payment} />
        </div>
    );
}
