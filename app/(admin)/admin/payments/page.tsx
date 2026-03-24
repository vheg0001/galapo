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

            {/* Main Table */}
            <PaymentsTable />
        </div>
    );
}
