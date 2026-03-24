"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
    Search, 
    Filter, 
    Eye, 
    XCircle, 
    Loader2, 
    ExternalLink,
    Calendar as CalendarIcon,
    AlertCircle,
    History,
    CheckCircle2 as CheckCircle,
    Download,
    Receipt
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { PaymentStatus } from "@/lib/types";
import { formatPeso } from "@/lib/subscription-helpers";
import { toast } from "react-hot-toast";

type StatusTab = "all" | "pending" | "verified" | "rejected";

export default function PaymentsTable() {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusTab, setStatusTab] = useState<StatusTab>("all");
    const [search, setSearch] = useState("");
    const [counts, setCounts] = useState({ pending: 0, verified: 0, rejected: 0, all: 0 });
    const [total, setTotal] = useState(0);
    const [verifyingId, setVerifyingId] = useState<string | null>(null);

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                status: statusTab,
                search: search,
                limit: "50",
                offset: "0"
            });
            
            const response = await fetch(`/api/admin/payments?${params}`);
            const data = await response.json();
            
            if (data.payments) {
                setPayments(data.payments);
                setTotal(data.total);
                if (data.counts) {
                    setCounts(data.counts);
                }
            }
        } catch (error) {
            console.error("Failed to fetch payments:", error);
        } finally {
            setLoading(false);
        }
    }, [statusTab, search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPayments();
        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [fetchPayments]);

    const handleQuickVerify = async (id: string) => {
        if (verifyingId) return;
        
        setVerifyingId(id);
        try {
            const res = await fetch(`/api/admin/payments/${id}/verify`, {
                method: "POST"
            });
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            toast.success("Payment verified and services activated!");
            fetchPayments(); // Refresh list
        } catch (error: any) {
            console.error("Quick verify failed:", error);
            toast.error(error.message || "Failed to verify payment");
        } finally {
            setVerifyingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Pending</Badge>;
            case "verified":
                return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Verified</Badge>;
            case "rejected":
                return <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200">Rejected</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-slate-200/60 shadow-sm rounded-3xl bg-white overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="flex flex-row items-center justify-between p-6">
                        <div className="space-y-1">
                            <p className="text-sm font-black text-slate-900 uppercase tracking-wider">Awaiting Verification</p>
                            <p className="text-3xl font-black text-slate-900">
                                {loading ? "..." : counts.pending}
                            </p>
                        </div>
                        <div className="bg-orange-50 p-2 rounded-2xl">
                            <AlertCircle className="h-6 w-6 text-orange-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-sm rounded-3xl bg-white overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="flex flex-row items-center justify-between p-6">
                        <div className="space-y-1">
                            <p className="text-sm font-black text-slate-900 uppercase tracking-wider">Verified Payments</p>
                            <p className="text-3xl font-black text-slate-900">
                                {loading ? "..." : counts.verified}
                            </p>
                        </div>
                        <div className="bg-emerald-50 p-2 rounded-2xl">
                            <CheckCircle className="h-6 w-6 text-emerald-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200/60 shadow-sm rounded-3xl bg-white overflow-hidden group hover:shadow-md transition-all">
                    <CardContent className="flex flex-row items-center justify-between p-6">
                        <div className="space-y-1">
                            <p className="text-sm font-black text-slate-900 uppercase tracking-wider">Historical Logs</p>
                            <p className="text-3xl font-black text-slate-900">
                                {loading ? "..." : counts.all}
                            </p>
                        </div>
                        <div className="bg-indigo-50 p-2 rounded-2xl">
                            <History className="h-6 w-6 text-indigo-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
            {/* Tabs & Search Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                    {(["all", "pending", "verified", "rejected"] as StatusTab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setStatusTab(tab)}
                            className={cn(
                                "px-4 py-2 text-sm font-bold rounded-lg transition-all capitalize relative",
                                statusTab === tab 
                                    ? "bg-white text-slate-900 shadow-sm" 
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            {tab}
                            {tab === "pending" && counts.pending > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white">
                                    {counts.pending}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search business or ref #..."
                        className="pl-9 bg-white rounded-xl border-slate-200"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table Card */}
            <Card className="border-slate-200/60 shadow-sm overflow-hidden rounded-2xl">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="w-[120px] font-bold text-slate-900">Date</TableHead>
                                <TableHead className="font-bold text-slate-900">Business / Owner</TableHead>
                                <TableHead className="font-bold text-slate-900">Payment For</TableHead>
                                <TableHead className="font-bold text-slate-900">Amount</TableHead>
                                <TableHead className="font-bold text-slate-900 text-center">Method</TableHead>
                                <TableHead className="font-bold text-slate-900">Reference #</TableHead>
                                <TableHead className="font-bold text-slate-900">Status</TableHead>
                                <TableHead className="text-right font-bold text-slate-900">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                                            <p className="text-sm font-medium text-slate-500">Loading payments...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : payments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-48 text-center text-slate-500 font-medium">
                                        No payments found {search ? `for "${search}"` : "under this status"}.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                payments.map((payment) => (
                                    <TableRow key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="text-xs font-medium text-slate-500">
                                            {format(new Date(payment.created_at), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-bold text-slate-900">{payment.listings?.business_name || "N/A"}</span>
                                                <span className="text-[10px] text-slate-500 font-medium">{payment.profiles?.full_name || payment.profiles?.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs font-bold text-slate-700">{payment.description}</span>
                                                {payment.plan_type && (
                                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{payment.plan_type} Plan</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-black text-slate-900">
                                            {formatPeso(payment.amount)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge 
                                                variant="outline" 
                                                className={cn(
                                                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5",
                                                    payment.payment_method?.toLowerCase() === "gcash" 
                                                        ? "bg-[#007DFE] text-white border-transparent" 
                                                        : payment.payment_method?.toLowerCase() === "maya" || payment.payment_method?.toLowerCase() === "paymaya"
                                                        ? "bg-emerald-500 text-white border-transparent"
                                                        : "bg-slate-100 text-slate-700 border-slate-200"
                                                )}
                                            >
                                                {payment.payment_method}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-[10px] text-slate-600">
                                            {payment.reference_number || "—"}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(payment.status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100" asChild title="Review Payment">
                                                    <Link href={`/admin/payments/${payment.id}`}>
                                                        <Eye className="h-4 w-4 text-slate-700" />
                                                    </Link>
                                                </Button>
                                                {payment.status === "verified" && payment.invoices?.[0] && (
                                                    <>
                                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100" asChild title="Download Invoice">
                                                            <Link href={`/admin/invoices/${payment.invoices[0].id}?print=true`}>
                                                                <Download className="h-4 w-4 text-slate-700" />
                                                            </Link>
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100" asChild title="View Invoice">
                                                            <Link href={`/admin/invoices/${payment.invoices[0].id}`}>
                                                                <Receipt className="h-4 w-4 text-slate-700" />
                                                            </Link>
                                                        </Button>
                                                    </>
                                                )}
                                                 {payment.status === "pending" && (
                                                      <Button 
                                                          size="sm" 
                                                          variant="ghost" 
                                                          className="h-8 w-8 p-0 rounded-lg hover:bg-emerald-50 text-emerald-600 disabled:opacity-50" 
                                                          title="Quick Verify"
                                                          onClick={() => handleQuickVerify(payment.id)}
                                                          disabled={verifyingId === payment.id}
                                                      >
                                                          {verifyingId === payment.id ? (
                                                              <Loader2 className="h-4 w-4 animate-spin" />
                                                          ) : (
                                                              <CheckCircle className="h-4 w-4" />
                                                          )}
                                                      </Button>
                                                 )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Pagination / Total count Footer */}
            {!loading && total > 0 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-sm font-medium text-slate-500">
                        Showing <span className="font-black text-slate-900">{payments.length}</span> of <span className="font-black text-slate-900">{total}</span> payments
                    </p>
                    {/* Add pagination controls if necessary */}
                </div>
            )}
        </div>
    </div>
    );
}
