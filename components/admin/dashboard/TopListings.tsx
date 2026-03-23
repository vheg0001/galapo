import Link from "next/link";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopListing {
    rank: number;
    id: string;
    slug: string;
    business_name: string;
    category_name: string;
    views: number;
    clicks: number;
    plan: string;
}

const PLAN_STYLE: Record<string, string> = {
    premium: "bg-purple-100 text-purple-700",
    featured: "bg-blue-100 text-blue-700",
    free: "bg-gray-100 text-gray-500",
};

interface TopListingsProps {
    listings: TopListing[];
}

export default function TopListings({ listings }: TopListingsProps) {
    return (
        <div className="rounded-[2.5rem] border border-border bg-background shadow-sm overflow-hidden ring-1 ring-border/50">
            <div className="flex items-center justify-between border-b border-border bg-muted/5 px-8 py-6">
                <div>
                    <h3 className="text-lg font-black tracking-tight text-foreground uppercase">Popular Businesses</h3>
                    <p className="text-xs font-medium text-muted-foreground">Top performing listings by visibility this month</p>
                </div>
                <Link
                    href="/admin/analytics"
                    className="rounded-xl bg-primary/10 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-primary transition-all hover:bg-primary/20 hover:scale-105 active:scale-95"
                >
                    Detailed Report
                </Link>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/20">
                            {["RANK", "BUSINESS NAME", "CATEGORY", "MONTHLY VIEWS", "ENGAGEMENT", "LEVEL"].map(h => (
                                <th key={h} className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {listings.length === 0 ? (
                            <tr><td colSpan={6} className="py-16 text-center text-sm font-medium text-muted-foreground italic">No data available for the current period.</td></tr>
                        ) : (
                            listings.map(l => (
                                <tr key={l.id} className="group hover:bg-muted/30 transition-all duration-300">
                                    <td className="px-8 py-5">
                                        <span className={cn(
                                            "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black shadow-sm ring-1 ring-inset",
                                            l.rank === 1 ? "bg-amber-100 text-amber-700 ring-amber-200" :
                                                l.rank === 2 ? "bg-slate-100 text-slate-700 ring-slate-200" :
                                                    l.rank === 3 ? "bg-orange-50 text-orange-700 ring-orange-200" :
                                                        "bg-muted text-muted-foreground ring-border"
                                        )}>
                                            {l.rank}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <Link href={`/admin/listings/${l.id}`} className="font-bold text-foreground group-hover:text-primary transition-colors hover:underline underline-offset-4 decoration-2">
                                            {l.business_name}
                                        </Link>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="inline-flex items-center rounded-md bg-muted/50 px-2 py-1 text-[10px] font-black text-muted-foreground uppercase tracking-tighter">
                                            {l.category_name}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/5 text-primary group-hover:scale-110 transition-transform">
                                                <Eye className="h-3.5 w-3.5" />
                                            </div>
                                            <span className="text-sm font-black text-foreground tabular-nums">
                                                {l.views.toLocaleString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col gap-1">
                                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (l.clicks / (l.views || 1)) * 500)}%` }} />
                                            </div>
                                            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">{(l.clicks / (l.views || 1) * 100).toFixed(1)}% CTR</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={cn(
                                            "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm ring-1 ring-inset",
                                            PLAN_STYLE[l.plan] ?? PLAN_STYLE.free,
                                            l.plan === 'premium' ? 'ring-purple-200' : l.plan === 'featured' ? 'ring-blue-200' : 'ring-border'
                                        )}>
                                            {l.plan}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
