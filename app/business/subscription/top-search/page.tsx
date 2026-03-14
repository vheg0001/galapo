import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getServerSession } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, Rocket } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Top Search Placement | GalaPo Business",
    description: "Appear as #1 Sponsored result in your category.",
};

export const dynamic = "force-dynamic";

export default async function TopSearchPage() {
    const session = await getServerSession();
    if (!session) return redirect("/login?callbackUrl=/business/subscription/top-search");

    const admin = createAdminSupabaseClient();

    // Fetch user's listings to let them choose which one to boost
    const { data: listings } = await admin
        .from("listings")
        .select("id, business_name, category_id, subcategory_id")
        .eq("owner_id", session.user.id)
        .eq("status", "approved");

    return (
        <div className="space-y-10 pb-20">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Top Search Placement</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">Be seen first by customers browsing your category.</p>
                </div>
                <Button variant="outline" className="rounded-xl font-bold border-slate-200" asChild>
                    <Link href="/business/subscription">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Billing Dashboard
                    </Link>
                </Button>
            </header>

            <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
                <div className="space-y-8">
                    <Card className="rounded-3xl border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-xl font-black text-slate-900">Select a Listing to Boost</CardTitle>
                            <CardDescription className="text-sm font-medium">Which business would you like to place at the top?</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {(listings ?? []).map((listing) => (
                                    <Link
                                        key={listing.id}
                                        href={`/business/subscription/top-search/purchase?listing=${listing.id}`}
                                        className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-[#FF6B35] hover:shadow-lg hover:shadow-orange-100"
                                    >
                                        <div className="mb-3 rounded-xl bg-slate-50 p-3 text-slate-400 group-hover:bg-orange-50 group-hover:text-[#FF6B35] transition-colors">
                                            <Rocket className="h-5 w-5" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-900">{listing.business_name}</p>
                                        <p className="mt-1 text-xs text-slate-500 font-medium italic">Click to continue</p>
                                    </Link>
                                ))}
                                {(!listings || listings.length === 0) && (
                                    <div className="col-span-full py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-sm font-bold text-slate-900">No approved listings found</p>
                                        <p className="mt-1 text-xs text-slate-500">Only approved listings can be boosted to Top Search.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <aside className="space-y-6">
                    <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl shadow-slate-200">
                        <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-[#FF6B35]">Why Top Search?</h3>
                        <ul className="space-y-4">
                            {[
                                "Appear in positions #1, #2, or #3",
                                "Eye-catching 'Sponsored' badge",
                                "Highlighted gold background listing",
                                "Maximum visibility for 30 days"
                            ].map((benefit) => (
                                <li key={benefit} className="flex items-start gap-3">
                                    <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                                        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-medium leading-relaxed opacity-90">{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="rounded-3xl border border-orange-100 bg-orange-50/50 p-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-2">Exclusivity Notice</p>
                        <p className="text-xs font-medium text-orange-900 leading-relaxed">
                            We only allow <span className="font-bold">3 sponsored slots</span> per category to ensure your business gets the attention it deserves without crowding the results.
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
}
