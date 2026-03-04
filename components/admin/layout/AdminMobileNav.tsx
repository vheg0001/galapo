"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import { cn } from "@/lib/utils";

interface AdminMobileNavProps {
    open: boolean;
    onClose: () => void;
    pendingListings?: number;
    pendingPayments?: number;
    pendingClaims?: number;
    adminName?: string;
}

export default function AdminMobileNav({
    open, onClose, pendingListings, pendingPayments, pendingClaims, adminName
}: AdminMobileNavProps) {
    // Prevent body scroll when open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
                    open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={cn(
                    "fixed left-0 top-0 z-50 h-full w-[260px] transition-transform duration-300 lg:hidden",
                    open ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <button
                    onClick={onClose}
                    className="absolute right-3 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-gray-400 hover:text-white"
                >
                    <X className="h-4 w-4" />
                </button>
                <AdminSidebar
                    collapsed={false}
                    onToggle={onClose}
                    pendingListings={pendingListings}
                    pendingPayments={pendingPayments}
                    pendingClaims={pendingClaims}
                    adminName={adminName}
                />
            </div>
        </>
    );
}
