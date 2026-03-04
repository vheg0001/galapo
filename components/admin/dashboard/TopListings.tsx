import Link from "next/link";
import { Eye } from "lucide-react";

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
        <div className="rounded-2xl border border-border bg-background shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h3 className="font-semibold text-foreground">Top Listings This Month</h3>
                <Link href="/admin/analytics" className="text-xs font-medium text-[#FF6B35] hover:underline">View analytics</Link>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-sm">
                    <thead className="border-b border-border bg-muted/40">
                        <tr>
                            {["#", "Business", "Category", "Views", "Clicks", "Plan"].map(h => (
                                <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {listings.length === 0 ? (
                            <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No data yet this month.</td></tr>
                        ) : (
                            listings.map(l => (
                                <tr key={l.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3 text-xs font-bold text-muted-foreground">#{l.rank}</td>
                                    <td className="px-4 py-3">
                                        <Link href={`/admin/listings/${l.id}`} className="font-medium text-foreground hover:text-[#FF6B35] transition truncate max-w-[160px] block">
                                            {l.business_name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">{l.category_name}</td>
                                    <td className="px-4 py-3">
                                        <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                            {l.views.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-foreground">{l.clicks.toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${PLAN_STYLE[l.plan] ?? PLAN_STYLE.free}`}>
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
