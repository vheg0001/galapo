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
    Receipt, 
    Eye, 
    Download, 
    Loader2,
    Calendar,
    ArrowUpDown
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { formatPeso } from "@/lib/subscription-helpers";
import { cn } from "@/lib/utils";

export default function AdminInvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [total, setTotal] = useState(0);

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                search: search,
                limit: "50",
                offset: "0"
            });
            const response = await fetch(`/api/admin/invoices?${params}`);
            const data = await response.json();
            if (data.invoices) {
                setInvoices(data.invoices);
                setTotal(data.total);
            }
        } catch (error) {
            console.error("Failed to fetch invoices:", error);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchInvoices();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchInvoices]);

    return (
        <div className="flex flex-col gap-8 p-6 md:p-8 max-w-7xl mx-auto w-full min-h-screen">
            {/* Header */}
            <div className="space-y-1.5">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-2xl shadow-lg shadow-indigo-100 italic">
                        <Receipt className="h-8 w-8 text-white" />
                    </div>
                    Invoices Management
                </h1>
                <p className="text-slate-500 font-medium text-lg">
                    Track and manage all invoices generated for verified business payments.
                </p>
            </div>

            {/* Filters */}
            <div className="flex justify-end">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search invoice # or business..."
                        className="pl-9 bg-white rounded-xl border-slate-200"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <Card className="border-slate-200/60 shadow-sm overflow-hidden rounded-2xl">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="w-[150px] font-bold text-slate-900">Invoice #</TableHead>
                                <TableHead className="font-bold text-slate-900">Issued Date</TableHead>
                                <TableHead className="font-bold text-slate-900">Business</TableHead>
                                <TableHead className="font-bold text-slate-900">Owner</TableHead>
                                <TableHead className="font-bold text-slate-900">Description</TableHead>
                                <TableHead className="font-bold text-slate-900">Amount</TableHead>
                                <TableHead className="font-bold text-slate-900">Method</TableHead>
                                <TableHead className="font-bold text-slate-900">Status</TableHead>
                                <TableHead className="text-right font-bold text-slate-900">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                            <p className="text-sm font-medium text-slate-500">Loading invoices...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : invoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-48 text-center text-slate-500 font-medium">
                                        No invoices found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                invoices.map((invoice) => (
                                    <TableRow key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-mono text-xs font-bold text-indigo-600 uppercase">
                                            {invoice.invoice_number}
                                        </TableCell>
                                        <TableCell className="text-xs font-medium text-slate-500">
                                            {format(new Date(invoice.issued_at), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-900">
                                            {invoice.listings?.business_name || "N/A"}
                                        </TableCell>
                                        <TableCell className="text-xs font-medium text-slate-500">
                                            {invoice.profiles?.full_name}
                                        </TableCell>
                                        <TableCell className="text-xs font-medium text-slate-500 truncate max-w-[200px]" title={invoice.description}>
                                            {invoice.description}
                                        </TableCell>
                                        <TableCell className="font-black text-slate-900">
                                            {formatPeso(invoice.amount)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant="outline" 
                                                className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest px-2 py-0.5",
                                                    invoice.payments?.payment_method?.toLowerCase() === "gcash"
                                                        ? "bg-[#007DFE] text-white border-transparent"
                                                        : "bg-slate-100 text-slate-700 border-slate-200"
                                                )}
                                            >
                                                {invoice.payments?.payment_method}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-emerald-500 text-white border-transparent font-black uppercase tracking-widest text-[9px] px-2 py-0.5">
                                                Paid
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100" asChild title="View Invoice">
                                                    <Link href={`/admin/invoices/${invoice.id}`}>
                                                        <Eye className="h-4 w-4 text-slate-700" />
                                                    </Link>
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100" asChild title="Print/Download">
                                                    <Link href={`/admin/invoices/${invoice.id}?print=true`}>
                                                        <Download className="h-4 w-4 text-slate-700" />
                                                    </Link>
                                                </Button>
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
