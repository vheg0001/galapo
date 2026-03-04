"use client";

const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(val);

interface RevenueBreakdownItem {
    label: string;
    amount: number;
    color: string;
}

interface RevenueOverviewProps {
    thisMonth: number;
    lastMonth: number;
    allTime: number;
    breakdown: RevenueBreakdownItem[];
}

export default function RevenueOverview({ thisMonth, lastMonth, allTime, breakdown }: RevenueOverviewProps) {
    const maxBreakdown = Math.max(...breakdown.map(b => b.amount), 1);
    const monthChange = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100).toFixed(1) : "0";

    return (
        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <h3 className="mb-4 font-semibold text-foreground">Revenue Overview</h3>

            {/* Stats row */}
            <div className="mb-6 grid grid-cols-3 gap-3">
                {[
                    { label: "This Month", value: thisMonth, badge: `${Number(monthChange) >= 0 ? "+" : ""}${monthChange}%` },
                    { label: "Last Month", value: lastMonth, badge: null },
                    { label: "All Time", value: allTime, badge: null },
                ].map(item => (
                    <div key={item.label} className="rounded-xl bg-muted/40 p-3 text-center">
                        <p className="text-[10px] text-muted-foreground font-medium">{item.label}</p>
                        <p className="mt-1 text-base font-bold text-foreground">{formatCurrency(item.value)}</p>
                        {item.badge && (
                            <span className={`mt-0.5 inline-block text-[10px] font-semibold ${Number(monthChange) >= 0 ? "text-green-600" : "text-red-500"}`}>
                                {item.badge} vs last month
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Breakdown bars */}
            <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Revenue Breakdown</p>
                {breakdown.map(item => (
                    <div key={item.label}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-semibold text-foreground">{formatCurrency(item.amount)}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                                style={{ width: `${(item.amount / maxBreakdown) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
