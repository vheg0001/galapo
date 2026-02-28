"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — Business Dashboard TopBar (Module 7.1)
// ──────────────────────────────────────────────────────────

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Settings, LogOut, ChevronDown, User } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import NotificationBell from "./NotificationBell";

interface TopBarProps {
    onMobileMenuToggle?: () => void;
    unreadNotifications?: number;
}

export default function TopBar({ onMobileMenuToggle, unreadNotifications = 0 }: TopBarProps) {
    const router = useRouter();
    const { profile, logout } = useAuthStore();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
            {/* Left: Hamburger (mobile) + Title */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onMobileMenuToggle}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
                    aria-label="Open menu"
                >
                    <Menu size={20} />
                </button>
                <h1 className="text-base font-semibold text-gray-800 lg:text-lg">
                    GalaPo Business Dashboard
                </h1>
            </div>

            {/* Right: Notifications + Profile */}
            <div className="flex items-center gap-2">
                <NotificationBell count={unreadNotifications} />

                {/* Profile Dropdown */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setDropdownOpen((v) => !v)}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B2A4A] text-xs font-bold text-white">
                            {profile?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <div className="hidden text-left md:block">
                            <p className="text-xs font-medium text-gray-800 leading-tight">
                                {profile?.full_name ?? "Business Owner"}
                            </p>
                            <p className="text-xs text-gray-500 leading-tight">{profile?.email}</p>
                        </div>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {dropdownOpen && (
                        <>
                            {/* Backdrop */}
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setDropdownOpen(false)}
                            />
                            {/* Menu */}
                            <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                                <Link
                                    href="/business/settings"
                                    onClick={() => setDropdownOpen(false)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    <Settings size={14} />
                                    Account Settings
                                </Link>
                                <div className="my-1 border-t border-gray-100" />
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    <LogOut size={14} />
                                    Logout
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
