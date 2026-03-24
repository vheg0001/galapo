import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import InvoiceView from "@/components/admin/invoices/InvoiceView";
import { Receipt } from "lucide-react";

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    return {
        title: `My Invoice ${id.substring(0, 8)} | GalaPo`,
    };
}

export default async function BusinessInvoiceDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        notFound();
    }

    const supabaseAdmin = (await import("@/lib/supabase")).createAdminSupabaseClient();

    const { data: invoice, error } = await supabaseAdmin
        .from("invoices")
        .select(`
            *,
            profiles:user_id (id, full_name, email),
            listings:listing_id (id, business_name, slug),
            payments:payment_id (id, payment_method, reference_number, subscriptions(plan_type))
        `)
        .eq("id", id)
        .eq("user_id", user.id) // Security: Ensure it belongs to the owner
        .single();

    if (error || !invoice) {
        notFound();
    }

    return (
        <div className="flex flex-col gap-6 p-6 md:p-8 max-w-7xl mx-auto w-full min-h-screen">
            <div className="space-y-1 print:hidden">
                <div className="flex items-center gap-2 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">
                    <Receipt className="h-3 w-3" />
                    <span>My Official Receipt</span>
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                    Invoice Details
                </h1>
            </div>

            <InvoiceView invoice={invoice} backUrl="/business/invoices" />
        </div>
    );
}
