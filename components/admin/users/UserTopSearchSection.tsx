"use client";

import { Badge } from "@/components/ui/badge";
import { format, isAfter, isBefore } from "date-fns";
import { Search, ExternalLink, Calendar } from "lucide-react";

interface TopSearchPlacement {
    id: string;
    listing_id: string;
    category_id: string;
    position: number;
    start_date: string;
    end_date: string;
    is_active: boolean;
    business_name?: string;
    category_name?: string;
}

interface UserTopSearchSectionProps {
    data: TopSearchPlacement[];
}

export default function UserTopSearchSection({ data }: UserTopSearchSectionProps) {
    const safeFormat = (dateStr: string, formatStr: string) => {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return "Invalid Date";
            return format(date, formatStr);
        } catch (e) {
            return "Invalid Date";
        }
    };

    const getStatus = (start: string, end: string, isActive: boolean) => {
        if (!isActive) return { label: "Inactive", color: "bg-gray-100 text-gray-600" };
        
        const now = new Date();
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (isBefore(now, startDate)) {
            return { label: "Upcoming", color: "bg-blue-100 text-blue-600" };
        }
        if (isAfter(now, endDate)) {
            return { label: "Expired", color: "bg-red-100 text-red-600" };
        }
        return { label: "Active", color: "bg-green-100 text-green-600" };
    };

    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">No Top Search Placements</h3>
                <p className="text-gray-500 max-w-sm mx-auto mt-2">
                    This user doesn't have any Top Search placements assigned to their listings yet.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Position</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Business / Category</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {data.map((item) => {
                            const status = getStatus(item.start_date, item.end_date, item.is_active);
                            return (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg">
                                                {item.position}
                                            </div>
                                            <span className="font-medium text-gray-900">Spot #{item.position}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-900">{item.business_name || "Unknown Business"}</span>
                                            <span className="text-sm text-gray-500">{item.category_name || "Unknown Category"}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>{safeFormat(item.start_date, "MMM dd, yyyy")}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-gray-400">
                                                <span className="w-3 text-center">-</span>
                                                <span>{safeFormat(item.end_date, "MMM dd, yyyy")}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge className={`${status.color} border-none shadow-none font-bold rounded-lg px-3 py-1`}>
                                            {status.label}
                                        </Badge>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
