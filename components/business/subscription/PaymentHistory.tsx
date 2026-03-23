"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Download, ExternalLink, BadgeCheck, Clock, AlertTriangle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPeso } from "@/lib/subscription-helpers";
import { cn } from "@/lib/utils";

interface PaymentHistoryProps {
    userId: string;
}

export default function PaymentHistory({ userId }: PaymentHistoryProps) {
    const [payments, setPayments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        async function loadPayments() {
            try {
                const response = await fetch(`/api/business/payments?page=${page}&limit=10`);
                const payload = await response.json();
                if (response.ok) {
                    setPayments(payload.data);
                    setTotalPages(payload.totalPages);
                }
            } catch (error) {
                console.error("Failed to load payments:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadPayments();
    }, [page, userId]);

    if (isLoading) {
        return (
            <div className="flex h-40 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#FF6B35]" />
                <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Loading history…</p>
            </div>
        );
    }

    if (payments.length === 0) {
        return (
            <div className="flex h-40 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                <div className="mb-4 rounded-full bg-slate-50 p-4 text-slate-300">
                    <Search className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-slate-900">No payment history found</p>
                <p className="mt-1 text-xs text-slate-500">Your payments will appear here once you make an upgrade.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-slate-100 hover:bg-transparent">
                            <TableHead className="w-[120px] text-[10px] font-black uppercase tracking-widest text-slate-500">Date</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Amount</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.map((p) => (
                            <TableRow key={p.id} className="border-slate-50 transition-colors hover:bg-slate-50/20">
                                <TableCell className="py-5 text-xs font-bold text-slate-600">
                                    {format(new Date(p.created_at), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell className="max-w-[200px] py-5">
                                    <p className="text-sm font-bold text-slate-900 line-clamp-1">{p.description}</p>
                                    <p className="text-[10px] font-bold text-slate-400 line-clamp-1">{p.listing_name}</p>
                                </TableCell>
                                <TableCell className="py-5 text-sm font-black text-slate-900">
                                    {formatPeso(p.amount)}
                                </TableCell>
                                <TableCell className="py-5">
                                    <div className="flex items-center gap-1.5">
                                        {p.status === "verified" ? (
                                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 rounded-full font-bold text-[10px] border-emerald-200 px-2.5 py-0.5">
                                                <BadgeCheck className="mr-1 h-3 w-3" /> VERIFIED
                                            </Badge>
                                        ) : p.status === "pending" ? (
                                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 rounded-full font-bold text-[10px] border-amber-200 px-2.5 py-0.5">
                                                <Clock className="mr-1 h-3 w-3" /> PENDING
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 rounded-full font-bold text-[10px] border-rose-200 px-2.5 py-0.5">
                                                <AlertTriangle className="mr-1 h-3 w-3" /> REJECTED
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="py-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {p.invoice ? (
                                            <button className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900" title="Download Invoice">
                                                <Download className="h-4 w-4" />
                                            </button>
                                        ) : null}
                                        <button className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900" title="View Transaction">
                                            <ExternalLink className="h-4 w-4" />
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-xs font-bold text-slate-400">Page {page} of {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
