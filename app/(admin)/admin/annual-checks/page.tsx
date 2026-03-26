"use client";

import { Suspense } from "react";
import AnnualChecksTable from "@/components/admin/annual-checks/AnnualChecksTable";
import { Loader2, ShieldCheck, HelpCircle } from "lucide-react";
import { 
    Tooltip, 
    TooltipContent, 
    TooltipProvider, 
    TooltipTrigger 
} from "@/components/ui/tooltip";

export default function AnnualChecksPage() {
    return (
        <div className="flex-1 space-y-8 p-8 pt-6 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-gray-900">
                        <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
                            <ShieldCheck className="h-6 w-6 text-white" />
                        </div>
                        Annual Listing Verifications
                    </h2>
                    <p className="text-gray-500 flex items-center gap-2">
                        Manage periodic listing accuracy checks and verification status.
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <HelpCircle className="h-4 w-4 text-gray-400" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    Annual checks ensure that business listings remain accurate. Listings not verified within 14 days of a check may be deactivated.
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </p>
                </div>
            </div>

            <Suspense fallback={
                <div className="h-[400px] flex items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm transition-all animate-pulse">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                        <p className="text-sm font-medium text-gray-400">Loading verification records...</p>
                    </div>
                </div>
            }>
                <AnnualChecksTable />
            </Suspense>
        </div>
    );
}
