"use client";

import { useState, useEffect } from "react";
import { AlertCircle, ArrowRight, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useBusinessStore } from "@/store/businessStore";

export default function VerificationBanner() {
    const { notifications } = useBusinessStore();
    const [isVisible, setIsVisible] = useState(true);

    // Find first unread annual check notification
    const annualCheckNotif = notifications.find(
        n => n.type === "annual_check" && !n.is_read
    );

    if (!annualCheckNotif || !isVisible) return null;

    const listingId = annualCheckNotif.data?.listing_id;
    const checkId = annualCheckNotif.data?.check_id;

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 p-1 shadow-lg shadow-orange-100 animate-in slide-in-from-top duration-500">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-orange-50/10 backdrop-blur-sm rounded-xl p-4 md:px-6">
                <div className="flex items-center gap-4 text-white">
                    <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center shrink-0 border border-white/30">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div className="space-y-0.5">
                        <h4 className="font-bold text-lg leading-tight">Verification Required</h4>
                        <p className="text-sm text-orange-50/90 font-medium">
                            {annualCheckNotif.message.replace("Action Required: ", "")}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button 
                        asChild
                        className="w-full md:w-auto bg-white text-orange-600 hover:bg-orange-50 font-bold px-6 shadow-sm border-none group"
                    >
                        <Link href={`/business/listings/${listingId}/verify?check_id=${checkId}`}>
                            Verify Now
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                    <button 
                        onClick={() => setIsVisible(false)}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        title="Dismiss"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>
            
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 h-32 w-32 bg-orange-400/20 rounded-full blur-2xl pointer-events-none" />
        </div>
    );
}
