"use client";

import { useEffect } from "react";
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

import { useSearchParams } from "next/navigation";

interface InvoiceViewProps {
    invoice: any;
    settings?: Record<string, any>;
    backUrl?: string;
}

export default function InvoiceView({ invoice, settings = {}, backUrl = "/admin/invoices" }: InvoiceViewProps) {
    const searchParams = useSearchParams();
    
    useEffect(() => {
        if (searchParams.get("print") === "true") {
            const timer = setTimeout(() => {
                window.print();
            }, 500); // Wait for animations
            return () => clearTimeout(timer);
        }
    }, [searchParams]);

    if (!invoice) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-6 sm:pb-12">
            {/* Action Bar - Hidden during print */}
            <div className="flex items-center justify-between print:hidden">
                <Button variant="ghost" className="w-fit rounded-xl font-bold text-slate-500 hover:text-slate-900 group" asChild>
                    <Link href={backUrl}>
                        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back
                    </Link>
                </Button>

                <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl border-slate-200 font-bold text-sm px-3 sm:px-4" onClick={handlePrint}>
                        <Printer className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Print Invoice</span>
                    </Button>
                    <Button className="rounded-xl bg-orange-600 font-bold text-white shadow-lg shadow-orange-100 text-sm px-3 sm:px-4" onClick={handlePrint}>
                        <Download className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Download</span> PDF
                    </Button>
                </div>
            </div>

            {/* Main Invoice Card */}
            <Card className="border-slate-200/60 shadow-xl rounded-2xl sm:rounded-[2.5rem] overflow-hidden bg-white print:shadow-none print:border-none print:rounded-none">
                <CardContent className="p-0">
                    {/* Premium Dark Header */}
                    <div 
                        className="bg-[#0F172A] p-4 sm:p-10 text-white flex flex-col md:flex-row print:flex-row justify-between gap-8 items-start relative overflow-hidden" 
                        style={{ 
                            WebkitPrintColorAdjust: 'exact', 
                            printColorAdjust: 'exact',
                            boxShadow: 'inset 0 0 0 1000px #0F172A'
                        } as any}
                    >
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        
                        <div className="space-y-6 relative z-10 w-full md:w-auto">
                            <div className="flex items-center gap-2.5 sm:gap-4">
                                <div className="bg-[#FF6B35] p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg shadow-orange-950/20" style={{ boxShadow: 'inset 0 0 0 1000px #FF6B35' } as any}>
                                    <Receipt className="h-5 w-5 sm:h-10 sm:w-10 text-white" />
                                </div>
                                <h1 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight leading-tight">
                                    {settings.site_name || "GalaPo City Directory"}
                                </h1>
                            </div>
                            <div className="space-y-1 text-slate-400 text-[10px] sm:text-sm font-medium ml-1">
                                <p>{settings.site_address || "Santa Rosa City, Laguna, Philippines"}</p>
                                <p>{settings.contact_email || "support@galapo.com"}</p>
                                <p>{settings.support_phone || "+63 900 000 0000"}</p>
                            </div>
                        </div>

                        <div className="text-left md:text-right print:text-right space-y-2 sm:space-y-3 relative z-10 w-full md:w-auto">
                            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter text-[#FF6B35]">Invoice</h2>
                            <div className="space-y-0.5 sm:space-y-1 text-slate-300">
                                <p className="font-mono text-xs sm:text-base font-bold tracking-widest opacity-80">#{invoice.invoice_number}</p>
                                <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Issued: {format(new Date(invoice.issued_at), "MMM d, yyyy")}</p>
                            </div>
                        </div>
                    </div>

                    {/* Body: Billing Details */}
                    <div className="p-4 sm:p-8 md:p-12 space-y-8 sm:space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-10">
                            <div className="space-y-5">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Billed To</h3>
                                <div className="space-y-2">
                                    <p className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                                        {invoice.listings?.business_name || "N/A"}
                                    </p>
                                    <div className="flex items-center gap-2 text-slate-600 font-bold ml-0.5">
                                        <User className="h-3.5 w-4 text-slate-400" />
                                        <span className="text-xs sm:text-base">{invoice.profiles?.full_name}</span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-400 font-bold ml-1">{invoice.profiles?.email}</p>
                                </div>
                            </div>

                            <div className="space-y-5 md:text-right print:text-right">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mr-1">Payment Method</h3>
                                <div className="space-y-2">
                                    <p className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                                        {invoice.payments?.payment_method || "Manual Payment"}
                                    </p>
                                    <p className="text-xs font-mono text-slate-500 font-bold tracking-wider italic">Ref: {invoice.payments?.reference_number || "Verified"}</p>
                                    <div className="mt-4 flex md:justify-end print:justify-end">
                                        <StatusBadge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black uppercase tracking-[0.2em] text-[10px] px-3 py-1 rounded-full">
                                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                            Paid
                                        </StatusBadge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items - Mobile Card View */}
                        <div className="block sm:hidden rounded-2xl border border-slate-100 shadow-sm overflow-hidden print:hidden">
                            {(invoice.items || [{ description: invoice.description || "Subscription Service", quantity: 1, price: invoice.amount, amount: invoice.amount }]).map((item: any, idx: number) => (
                                <div key={idx} className="p-4 border-b border-slate-50 last:border-0">
                                    <p className="text-base font-black text-slate-900 tracking-tight">{item.description}</p>
                                    {invoice.payments?.subscriptions?.plan_type && (
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                                            {invoice.payments.subscriptions.plan_type} Subscription
                                        </p>
                                    )}
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Qty: {item.quantity || 1}</span>
                                        <span className="text-lg font-black text-slate-900">{formatPeso(item.amount || invoice.amount)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Items Table - Desktop */}
                        <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-100 shadow-sm print:block">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/80 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Description</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">Qty</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">Price</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {(invoice.items || [{ description: invoice.description || "Subscription Service", quantity: 1, price: invoice.amount, amount: invoice.amount }]).map((item: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                                            <td className="px-6 py-5 print:py-3">
                                                <p className="text-xl font-black text-slate-900 tracking-tight">{item.description}</p>
                                                {invoice.payments?.subscriptions?.plan_type && (
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
                                                        {invoice.payments.subscriptions.plan_type} Subscription
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 print:py-3 text-center font-black text-slate-600 text-lg">{item.quantity || 1}</td>
                                            <td className="px-6 py-5 print:py-3 text-right font-bold text-slate-600 text-lg">{formatPeso(item.price || invoice.amount)}</td>
                                            <td className="px-6 py-5 print:py-3 text-right font-black text-slate-900 text-xl">{formatPeso(item.amount || invoice.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Summary */}
                        <div className="flex flex-col md:flex-row print:flex-row justify-between items-start pt-10 border-t border-slate-100 gap-10">
                            <div className="max-w-xs space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Important Notes</h4>
                                <p className="text-[13px] leading-relaxed text-slate-500 font-bold italic opacity-75">
                                    This invoice serves as your official receipt for the payment made. Digital services are activated immediately after verification. For support, please contact us at {settings.contact_email || "support@galapo.com"}.
                                </p>
                            </div>

                            <div className="w-full md:w-80 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-base">
                                        <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Subtotal</span>
                                        <span className="font-black text-slate-900 text-lg">{formatPeso(invoice.amount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-base">
                                        <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Tax (0%)</span>
                                        <span className="font-black text-slate-900 text-lg">{formatPeso(0)}</span>
                                    </div>
                                    <div className="h-[2px] bg-slate-100 rounded-full" />
                                    <div className="flex justify-between items-center">
                                        <span className="font-black text-slate-900 uppercase tracking-[0.3em] text-[10px] sm:text-[11px]">Total Paid</span>
                                        <span className="text-2xl sm:text-4xl font-black text-[#FF6B35] tracking-tighter">{formatPeso(invoice.amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Thank you */}
                        <div className="pt-8 text-center border-t border-slate-100">
                            <p className="text-[12px] font-black text-slate-300 uppercase tracking-[0.5em] ml-2">Thank you for your business!</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0.5cm;
                        size: A4;
                    }
                    body {
                        background: white !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    /* Hide dashboard navigation only */
                    [class*="print:hidden"], nav, footer, aside, header {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
