import Link from "next/link";
import { ClipboardList, AlertTriangle } from "lucide-react";

interface AnnualChecksStatusProps {
    dueThisWeek: number;
    noResponse: number;
}

export default function AnnualChecksStatus({ dueThisWeek, noResponse }: AnnualChecksStatusProps) {
    return (
        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                        <ClipboardList className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-foreground">Annual Checks</h3>
                </div>
                <Link href="/admin/annual-checks" className="text-xs font-medium text-[#FF6B35] hover:underline">
                    Manage
                </Link>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
                    <span className="text-sm text-muted-foreground">Due this week</span>
                    <span className={`text-lg font-extrabold ${dueThisWeek > 0 ? "text-orange-500" : "text-foreground"}`}>
                        {dueThisWeek}
                    </span>
                </div>

                <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${noResponse > 0 ? "bg-red-50 border border-red-200" : "bg-muted/40"}`}>
                    <div className="flex items-center gap-2">
                        {noResponse > 0 && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        <span className={`text-sm ${noResponse > 0 ? "font-semibold text-red-700" : "text-muted-foreground"}`}>
                            No response (past deadline)
                        </span>
                    </div>
                    <span className={`text-lg font-extrabold ${noResponse > 0 ? "text-red-600" : "text-foreground"}`}>
                        {noResponse}
                    </span>
                </div>
            </div>
        </div>
    );
}
