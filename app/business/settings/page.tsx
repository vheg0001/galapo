"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — Account Settings Page (Module 8.1)
// ──────────────────────────────────────────────────────────

import { useState } from "react";
import { User, Lock, Bell } from "lucide-react";
import AvatarUpload from "@/components/business/settings/AvatarUpload";
import ProfileForm from "@/components/business/settings/ProfileForm";
import PasswordForm from "@/components/business/settings/PasswordForm";
import NotificationPreferences from "@/components/business/settings/NotificationPreferences";

export const dynamic = "force-dynamic";

type Tab = "profile" | "password" | "notifications";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "password", label: "Password", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>("profile");

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                <p className="mt-1 text-sm text-gray-500">Manage your profile, password, and preferences</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                {/* Sidebar / Tabs */}
                <div className="lg:col-span-1">
                    <nav className="flex gap-1 overflow-x-auto rounded-xl border border-gray-100 bg-white p-1.5 lg:flex-col">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const active = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-medium transition whitespace-nowrap ${active
                                            ? "bg-[#FF6B35] text-white shadow-sm"
                                            : "text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    <Icon size={16} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content */}
                <div className="lg:col-span-3">
                    <div className="rounded-xl border border-gray-100 bg-white p-6">
                        {activeTab === "profile" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">Profile Information</h2>
                                    <p className="mt-0.5 text-sm text-gray-500">Update your display name and contact</p>
                                </div>
                                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                                    <AvatarUpload />
                                    <div className="flex-1 w-full">
                                        <ProfileForm />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "password" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">Change Password</h2>
                                    <p className="mt-0.5 text-sm text-gray-500">Update your password to keep your account secure</p>
                                </div>
                                <PasswordForm />
                            </div>
                        )}

                        {activeTab === "notifications" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">Notification Preferences</h2>
                                    <p className="mt-0.5 text-sm text-gray-500">Choose what email notifications you receive</p>
                                </div>
                                <NotificationPreferences />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
