import { Metadata } from "next";
import UsersTable from "@/components/admin/users/UsersTable";
import { Users, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "Business Owners | Admin Dashboard",
    description: "Manage business owners and their accounts",
};

export default function BusinessOwnersPage() {
    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm uppercase tracking-wider">
                        <Users className="h-4 w-4" />
                        Admin Management
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Business Owners</h1>
                    <p className="text-gray-500">
                        View, manage and support all registered business owners on the platform.
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 bg-white hover:bg-gray-50 border-gray-200">
                        <FileDown className="h-4 w-4" />
                        Export to CSV
                    </Button>
                </div>
            </div>

            {/* Users Table & Stats (Internal to UsersTable) */}
            <UsersTable />
        </div>
    );
}
