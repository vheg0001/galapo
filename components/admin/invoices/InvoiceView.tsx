"use client";

import { 
    Printer, 
    Download, 
    Receipt, 
    Building2, 
    User, 
    CheckCircle2,
    ArrowLeft
} from "lucide-react";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
import { Badge as StatusBadge } from "../../ui/badge";
import { format } from "date-fns";
import { formatPeso } from "../../../lib/subscription-helpers";
import { cn as mergeClasses } from "../../../lib/utils";
import Link from "next/link";

interface InvoiceViewProps {
    invoice: any;
    backUrl?: string;
}

export default function InvoiceView({ invoice, backUrl = "/admin/invoices" }: InvoiceViewProps) {
    if (!invoice) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            {/* Action Bar - Hidden during print */}
            <div className="flex items-center justify-between print:hidden">
                <Button variant="ghost" className="rounded-xl font-bold text-slate-500 hover:text-slate-900 group" asChild>
                    <Link href={backUrl}>
                        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back
                    </Link>
                </Button>

                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl border-slate-200 font-bold" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Invoice
                    </Button>
                    <Button className="rounded-xl bg-orange-600 font-bold text-white shadow-lg shadow-orange-100" onClick={handlePrint}>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
                </div>
            </div>

            {/* Main Invoice Card */}
            <Card className="border-slate-200/60 shadow-xl rounded-3xl overflow-hidden bg-white print:shadow-none print:border-none print:rounded-none">
                <CardContent className="p-0">
                    {/* Header: Brand & Meta */}
                    <div className="bg-slate-900 p-8 md:p-12 text-white flex flex-col md:flex-row justify-between gap-8 items-start relative overflow-hidden">
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        
                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-500 p-2 rounded-xl italic">
                                    <Receipt className="h-8 w-8 text-white" />
                                </div>
                                <h1 className="text-3xl font-black tracking-tight">GalaPo City Directory</h1>
                            </div>
                            <div className="space-y-1 text-slate-400 text-sm font-medium">
                                <p>Santa Rosa City, Laguna, Philippines</p>
                                <p>support@galapo.com</p>
                                <p>+63 900 000 0000</p>
                            </div>
                        </div>

                        <div className="text-left md:text-right space-y-2 relative z-10">
                            <h2 className="text-4xl font-black uppercase tracking-widest text-orange-500 opacity-90">Invoice</h2>
                            <div className="space-y-1 text-slate-300">
                                <p className="font-mono text-sm uppercase tracking-wider">#{invoice.invoice_number}</p>
                                <p className="text-xs font-bold uppercase tracking-widest opacity-60">Issued: {format(new Date(invoice.issued_at), "MMM d, yyyy")}</p>
                            </div>
                        </div>
                    </div>

                    {/* Body: Billing Details */}
                    <div className="p-8 md:p-12 space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Billed To</h3>
                                <div className="space-y-1">
                                    <p className="text-xl font-black text-slate-900 leading-tight">
                                        {invoice.listings?.business_name || "N/A"}
                                    </p>
                                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                                        <User className="h-4 w-4 text-slate-300" />
                                        <span>{invoice.profiles?.full_name}</span>
                                    </div>
                                    <p className="text-sm text-slate-400 font-medium">{invoice.profiles?.email}</p>
                                </div>
                            </div>

                            <div className="space-y-4 md:text-right">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payment Method</h3>
                                <div className="space-y-1">
                                    <p className="text-lg font-black text-slate-900 uppercase">
                                        {invoice.payments?.payment_method || "Manual Payment"}
                                    </p>
                                    <p className="text-xs font-mono text-slate-500 uppercase tracking-wider italic">Ref: {invoice.payments?.reference_number || "Verified"}</p>
                                    <div className="mt-2 flex md:justify-end">
                                        <StatusBadge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black uppercase tracking-widest text-[9px]">
                                            <CheckCircle2 className="mr-1 h-3 w-3" />
                                            Paid
                                        </StatusBadge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Description</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Qty</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Price</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {(invoice.items || []).map((item: any, idx: number) => (
                                        <tr key={idx}>
                                            <td className="px-6 py-6">
                                                <p className="font-black text-slate-900">{item.description}</p>
                                                {invoice.payments?.plan_type && (
                                                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">
                                                        {invoice.payments.plan_type} Subscription Plan
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-6 text-center font-bold text-slate-600">{item.quantity || 1}</td>
                                            <td className="px-6 py-6 text-right font-bold text-slate-600">{formatPeso(item.price || invoice.amount)}</td>
                                            <td className="px-6 py-6 text-right font-black text-slate-900">{formatPeso(item.amount || invoice.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Summary */}
                        <div className="flex flex-col md:flex-row justify-between items-start pt-8 border-t border-slate-100 gap-12">
                            <div className="max-w-xs space-y-2">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Important Notes</h4>
                                <p className="text-[11px] leading-relaxed text-slate-500 font-medium italic">
                                    This invoice serves as your official receipt for the payment made. Digital services are activated immediately after verification. For support, please contact us at support@galapo.com.
                                </p>
                            </div>

                            <div className="w-full md:w-64 space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold text-slate-400">Subtotal</span>
                                        <span className="font-black text-slate-900">{formatPeso(invoice.amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold text-slate-400">Tax (0%)</span>
                                        <span className="font-black text-slate-900">{formatPeso(0)}</span>
                                    </div>
                                    <div className="h-px bg-slate-100" />
                                    <div className="flex justify-between items-center text-lg">
                                        <span className="font-black text-slate-900 uppercase tracking-widest text-[11px]">Total Paid</span>
                                        <span className="text-2xl font-black text-orange-600">{formatPeso(invoice.amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Thank you */}
                        <div className="pt-12 text-center">
                            <p className="text-sm font-black text-slate-300 uppercase tracking-[0.3em]">Thank you for your business!</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: auto;
                    }
                    body {
                        background: white !important;
                        padding: 0 !important;
                    }
                    nav, footer, .print-hide {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
