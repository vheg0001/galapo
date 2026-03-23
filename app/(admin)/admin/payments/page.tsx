import { Metadata } from "next";
import PaymentsTable from "@/components/admin/payments/PaymentsTable";
import { CreditCard, History, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Payment Verification | Admin | GalaPo",
    description: "Verify and manage business owner payments and subscriptions.",
};

export default function AdminPaymentsPage() {
    return (
        <div className="flex flex-col gap-8 p-6 md:p-8 max-w-7xl mx-auto w-full min-h-screen">
            {/* Header Section */}
            <div className="space-y-1.5 text-center md:text-left">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex flex-col md:flex-row items-center gap-3">
                    <div className="bg-orange-500 p-2 rounded-2xl shadow-lg shadow-orange-100 italic">
                        <CreditCard className="h-8 w-8 text-white" />
                    </div>
                    Payment Verification
                </h1>
                <p className="text-slate-500 font-medium text-lg">
                    Review, verify, and manage all payment proofs uploaded by business owners.
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-slate-200/60 shadow-sm rounded-3xl bg-white overflow-hidden group hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-wider">Awaiting Verification</CardTitle>
                            <CardDescription className="text-xs font-medium text-slate-500">Payments needing your review</CardDescription>
                        </div>
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                    </CardHeader>
                    <div className="p-6 pt-0">
                        <div className="text-3xl font-black text-slate-900">...</div>
                    </div>
                </Card>

                <Card className="border-slate-200/60 shadow-sm rounded-3xl bg-white overflow-hidden group hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-wider">Recent Activity</CardTitle>
                            <CardDescription className="text-xs font-medium text-slate-500">Verified in the last 24h</CardDescription>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </CardHeader>
                    <div className="p-6 pt-0">
                        <div className="text-3xl font-black text-slate-900">...</div>
                    </div>
                </Card>

                <Card className="border-slate-200/60 shadow-sm rounded-3xl bg-white overflow-hidden group hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-wider">Historical Logs</CardTitle>
                            <CardDescription className="text-xs font-medium text-slate-500">Total payments processed</CardDescription>
                        </div>
                        <History className="h-5 w-5 text-indigo-600" />
                    </CardHeader>
                    <div className="p-6 pt-0">
                        <div className="text-3xl font-black text-slate-900">...</div>
                    </div>
                </Card>
            </div>

            {/* Main Table */}
            <PaymentsTable />
        </div>
    );
}
