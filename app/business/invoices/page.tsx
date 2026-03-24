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
import { Card, CardContent } from "@/components/ui/card";
import { 
    Receipt, 
    Eye, 
    Download, 
    Loader2,
    Calendar,
    ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { formatPeso } from "@/lib/subscription-helpers";

export default function BusinessInvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/business/invoices");
            const data = await response.json();
            if (data.invoices) {
                setInvoices(data.invoices);
            }
        } catch (error) {
            console.error("Failed to fetch invoices:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    return (
        <div className="flex flex-col gap-8 p-6 md:p-8 max-w-7xl mx-auto w-full min-h-screen">
             {/* Header */}
             <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="bg-orange-600 p-2 rounded-2xl shadow-lg shadow-orange-100 italic">
                            <Receipt className="h-8 w-8 text-white" />
                        </div>
                        My Invoices
                    </h1>
                    <p className="text-slate-500 font-medium text-lg">
                        View and download your official receipts for GalaPo services.
                    </p>
                </div>
            </div>

            {/* Table */}
            <Card className="border-slate-200/60 shadow-sm overflow-hidden rounded-2xl bg-white">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="w-[150px] font-bold text-slate-900">Invoice #</TableHead>
                                <TableHead className="font-bold text-slate-900">Date Issued</TableHead>
                                <TableHead className="font-bold text-slate-900">For Listing</TableHead>
                                <TableHead className="font-bold text-slate-900">Description</TableHead>
                                <TableHead className="font-bold text-slate-900">Amount</TableHead>
                                <TableHead className="font-bold text-slate-900">Status</TableHead>
                                <TableHead className="text-right font-bold text-slate-900">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                                            <p className="text-sm font-medium text-slate-500">Loading your invoices...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : invoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-48 text-center text-slate-500 font-medium">
                                        No invoices found. Once your payment is verified, your invoice will appear here.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                invoices.map((invoice) => (
                                    <TableRow key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-mono text-xs font-bold text-orange-600 uppercase">
                                            {invoice.invoice_number}
                                        </TableCell>
                                        <TableCell className="text-xs font-medium text-slate-500">
                                            {format(new Date(invoice.issued_at), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-900">
                                            {invoice.listings?.business_name}
                                        </TableCell>
                                        <TableCell className="text-xs font-medium text-slate-500">
                                            {invoice.description}
                                        </TableCell>
                                        <TableCell className="font-black text-slate-900">
                                            {formatPeso(invoice.amount)}
                                        </TableCell>
                                        <TableCell>
                                            {invoice.payments?.status === "verified" ? (
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 font-black uppercase tracking-widest text-[9px]">
                                                    Paid
                                                </Badge>
                                            ) : invoice.payments?.status === "pending" ? (
                                                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 font-black uppercase tracking-widest text-[9px]">
                                                    Pending
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 font-black uppercase tracking-widest text-[9px]">
                                                    Rejected
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {invoice.payments?.status === "verified" ? (
                                                    <>
                                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100" asChild title="View & Print">
                                                            <Link href={`/business/invoices/${invoice.id}`}>
                                                                <Eye className="h-4 w-4 text-slate-700" />
                                                            </Link>
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100" asChild title="Download PDF">
                                                            <Link href={`/business/invoices/${invoice.id}?print=true`}>
                                                                <Download className="h-4 w-4 text-slate-700" />
                                                            </Link>
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                                                        Unavailable
                                                    </span>
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
        </div>
    );
}
