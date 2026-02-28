import type { Metadata } from "next";
import Link from "next/link";
import { LayoutDashboard, Store, PlusCircle, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
    title: "Business Dashboard | GalaPo",
    description: "Manage your GalaPo business listing.",
};

const QUICK_ACTIONS = [
    {
        label: "My Listings",
        description: "View and manage your business listings",
        href: "/business/listings",
        icon: Store,
        color: "bg-blue-50 text-blue-600",
    },
    {
        label: "Add New Listing",
        description: "Create a new business listing on GalaPo",
        href: "/business/listings/new",
        icon: PlusCircle,
        color: "bg-green-50 text-green-600",
    },
    {
        label: "View Analytics",
        description: "See how your listing is performing",
        href: "/business/analytics",
        icon: TrendingUp,
        color: "bg-purple-50 text-purple-600",
    },
];

export default function BusinessDashboardPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Welcome back! Here's a summary of your business presence on GalaPo.
                </p>
            </div>

            {/* Stats Placeholder */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                    { label: "Total Listings", value: "—" },
                    { label: "Profile Views", value: "—" },
                    { label: "Phone Clicks", value: "—" },
                    { label: "Active Deals", value: "—" },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                        <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="mb-3 text-base font-semibold text-gray-800">Quick Actions</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                    {QUICK_ACTIONS.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Link
                                key={action.href}
                                href={action.href}
                                className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-gray-300"
                            >
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${action.color}`}>
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{action.label}</p>
                                    <p className="mt-0.5 text-xs text-gray-500">{action.description}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Getting Started */}
            <div className="rounded-xl border border-[#FF6B35]/20 bg-[#FF6B35]/5 p-6">
                <h2 className="text-base font-semibold text-gray-900">Getting Started</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Your business dashboard is ready. Start by adding your first business listing to appear on GalaPo.
                </p>
                <Link
                    href="/business/listings/new"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e55a25] transition"
                >
                    <PlusCircle size={16} />
                    Add Your First Listing
                </Link>
            </div>
        </div>
    );
}
