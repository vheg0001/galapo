"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Download, Eye, FileText, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPeso } from "@/lib/subscription-helpers";
import { Button } from "@/components/ui/button";

interface InvoicesListProps {
    userId: string;
}

export default function InvoicesList({ userId }: InvoicesListProps) {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        async function loadInvoices() {
            try {
                const response = await fetch(`/api/business/invoices?page=${page}&limit=10`);
                const data = await response.json();
                if (response.ok) {
                    setInvoices(data.invoices);
                    setTotalPages(Math.ceil(data.total / 10));
                }
            } catch (error) {
                console.error("Failed to load invoices:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadInvoices();
    }, [page, userId]);

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Loading invoices...</div>;
    }

    if (invoices.length === 0) {
        return (
            <div className="flex h-40 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                <FileText className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-900">No invoices yet</p>
                <p className="text-xs text-slate-500">Your invoices will appear here after your payments are verified.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Number</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Date</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Amount</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</TableHead>
                            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.map((inv) => (
                            <TableRow key={inv.id}>
                                <TableCell className="text-xs font-bold text-slate-900">{inv.invoice_number}</TableCell>
                                <TableCell className="text-xs text-slate-600">{format(new Date(inv.issued_at), "MMM d, yyyy")}</TableCell>
                                <TableCell className="text-xs font-medium text-slate-700">{inv.description}</TableCell>
                                <TableCell className="text-xs font-black text-slate-900">{formatPeso(inv.amount)}</TableCell>
                                <TableCell>
                                    <Badge className="bg-emerald-100 text-emerald-700 rounded-full font-bold text-[10px] uppercase">
                                        {inv.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900" title="View Detail">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900" title="Download PDF">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {/* Pagination Placeholder */}
        </div>
    );
}
