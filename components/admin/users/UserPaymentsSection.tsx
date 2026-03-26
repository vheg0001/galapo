"use client";

import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";

interface UserPaymentsSectionProps {
    type: "subscriptions" | "payments";
    data: any[];
}

export default function UserPaymentsSection({ type, data }: UserPaymentsSectionProps) {
    if (data.length === 0) {
        return (
            <div className="h-32 flex items-center justify-center text-gray-500 italic">
                No {type} history found.
            </div>
        );
    }

    const safeFormat = (dateStr: string | null | undefined, formatStr: string) => {
        if (!dateStr) return "—";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "—";
        return format(date, formatStr);
    };

    return (
        <div className="overflow-hidden">
            <Table>
                <TableHeader className="bg-gray-50/50">
                    <TableRow>
                        <TableHead>{type === 'subscriptions' ? 'Plan / Listing' : 'Description'}</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>{type === 'subscriptions' ? 'Period' : 'Method'}</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item) => (
                        <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors">
                            <TableCell className="max-w-[200px]">
                                <div className="font-semibold text-gray-900 truncate">
                                    {type === 'subscriptions' 
                                        ? `${(item.plan_type || 'PLAN').toUpperCase()} - ${item.listings?.business_name || 'Listing'}`
                                        : `Payment for ${item.listings?.business_name || 'Listing'}`
                                    }
                                </div>
                                {item.reference_number && (
                                    <div className="text-[10px] text-gray-400 font-mono tracking-tighter">
                                        REF: {item.reference_number}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className="font-bold text-gray-900">
                                ₱{Number(item.amount).toLocaleString()}
                            </TableCell>
                            <TableCell>
                                {item.status === 'active' || item.status === 'paid' || item.status === 'approved' ? (
                                    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100">
                                        Active
                                    </Badge>
                                ) : item.status === 'pending' ? (
                                    <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-100">
                                        Pending
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-gray-400 capitalize">
                                        {item.status}
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                                {type === 'subscriptions' 
                                    ? item.start_date ? `${safeFormat(item.start_date, "MM/dd")} - ${safeFormat(item.end_date, "MM/dd")}` : "—"
                                    : <div className="flex items-center gap-1 font-medium capitalize">{item.payment_method || "Other"}</div>
                                }
                            </TableCell>
                            <TableCell className="text-xs text-gray-500">
                                {safeFormat(item.created_at, "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Details">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
