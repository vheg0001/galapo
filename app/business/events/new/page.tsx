import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import EventForm from "@/components/business/events/EventForm";

export const dynamic = "force-dynamic";

export default async function NewBusinessEventPage() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: listings } = await supabase
        .from("listings")
        .select("id, business_name, address, slug, is_featured, is_premium")
        .eq("owner_id", user.id)
        .eq("status", "approved")
        .eq("is_active", true)
        .order("business_name", { ascending: true });

    return (
        <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-10">
            <div className="flex items-center gap-4">
                <Link href="/business/events" className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground">
                    <ChevronLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground">Create New Event</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Fill in the details below to publish your event.</p>
                </div>
            </div>

            <EventForm listings={listings || []} />
        </div>
    );
}