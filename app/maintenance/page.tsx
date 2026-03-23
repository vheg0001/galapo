"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Hammer, ArrowLeft, Mail, Phone } from "lucide-react";

export default function MaintenancePage() {
    const [currentYear, setCurrentYear] = useState<number | null>(null);

    useEffect(() => {
        setCurrentYear(new Date().getFullYear());
    }, []);

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#0a0a0c] text-white flex items-center justify-center p-6">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/maintenance-bg.png"
                    alt="Maintenance Background"
                    fill
                    className="object-cover opacity-40"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c]/80 via-transparent to-[#0a0a0c]" />
            </div>

            {/* Content Card */}
            <div className="relative z-10 max-w-2xl w-full">
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl text-center space-y-8">
                    {/* Icon Stack */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                            <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                                <Hammer className="h-10 w-10 text-white animate-bounce-slow" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                            We're Polishing <span className="text-secondary italic">GalaPo</span>
                        </h1>
                        <p className="text-lg text-white/60 leading-relaxed max-w-md mx-auto">
                            We're currently performing some scheduled maintenance to improve your experience.
                            We'll be back online very shortly!
                        </p>
                    </div>

                    {/* Progress Indicator (Fake for aesthetic) */}
                    <div className="space-y-2">
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary to-secondary w-3/4 animate-pulse rounded-full" />
                        </div>
                        <p className="text-[11px] uppercase tracking-widest text-white/40 font-semibold text-right">
                            Almost there — 75% complete
                        </p>
                    </div>

                    <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-center gap-6">
                        <div className="flex items-center gap-2 text-white/40 text-sm">
                            <Mail className="h-4 w-4" />
                            <span>support@galapo.ph</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/40 text-sm">
                            <Phone className="h-4 w-4" />
                            <span>+63 9XX XXX XXXX</span>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Link
                            href="/admin/login"
                            className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest font-bold"
                        >
                            <ArrowLeft className="h-3 w-3" />
                            Admin Access
                        </Link>
                    </div>
                </div>

                {/* Footer simple */}
                <p className="text-center mt-8 text-white/20 text-xs tracking-widest uppercase font-medium">
                    &copy; {currentYear || "...."} GalaPo. All rights reserved.
                </p>
            </div>
        </div>
    );
}
