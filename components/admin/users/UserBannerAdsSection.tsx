"use client";

import { Badge } from "@/components/ui/badge";
import { format, isAfter, isBefore } from "date-fns";
import { Image, ExternalLink, Calendar, MousePointer2, Eye } from "lucide-react";

interface BannerAd {
    id: string;
    title: string;
    image_url: string;
    target_url: string;
    placement_location: string;
    listing_id?: string;
    advertiser_id?: string;
    start_date: string;
    end_date: string;
    impressions: number;
    clicks: number;
    is_active: boolean;
    business_name?: string;
}

interface UserBannerAdsSectionProps {
    data: BannerAd[];
}

export default function UserBannerAdsSection({ data }: UserBannerAdsSectionProps) {
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

    const formatLocation = (loc: string) => {
        return loc.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
                <Image className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">No Banner Ads</h3>
                <p className="text-gray-500 max-w-sm mx-auto mt-2">
                    This user doesn't have any Banner Ad placements assigned to their listings yet.
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
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Banner</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Location / Link</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Stats</th>
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
                                            <div className="h-12 w-20 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 relative group flex items-center justify-center">
                                                {item.image_url ? (
                                                    <img 
                                                        src={item.image_url} 
                                                        alt={item.title} 
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <Image className="h-5 w-5 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900">{item.title}</span>
                                                <span className="text-xs text-gray-500 font-medium">
                                                    For: {item.business_name || "Account Profile"}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-700">{formatLocation(item.placement_location)}</span>
                                            <a 
                                                href={item.target_url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                Target URL
                                            </a>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                <Eye className="h-3.5 w-3.5 text-gray-400" />
                                                <span className="font-bold">{item.impressions.toLocaleString()}</span>
                                                <span className="text-xs text-gray-400 font-medium">views</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                <MousePointer2 className="h-3.5 w-3.5 text-gray-400" />
                                                <span className="font-bold">{item.clicks.toLocaleString()}</span>
                                                <span className="text-xs text-gray-400 font-medium">clicks</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col text-sm text-gray-600 font-medium">
                                            <div className="flex items-center gap-1 text-gray-900">
                                                <span>{safeFormat(item.start_date, "MMM dd")}</span>
                                                <span className="text-gray-300 mx-0.5">-</span>
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
