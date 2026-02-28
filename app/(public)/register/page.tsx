import type { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";
import { CheckCircle, Star } from "lucide-react";

export const metadata: Metadata = {
    title: "Register Your Business | GalaPo - Olongapo City Directory",
    description:
        "List your Olongapo business on GalaPo for free. Reach thousands of local residents and tourists. Set up your business profile today.",
    robots: { index: false, follow: false },
};

const BENEFITS = [
    "Free basic listing forever",
    "Reach thousands of Olongapo residents and tourists",
    "Manage your business info, photos, and hours",
    "Post deals and events",
    "Get found on Google with SEO-optimized listing",
];

export default function RegisterPage() {
    return (
        <div className="flex min-h-screen">
            {/* Left — Registration Form */}
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <a href="/" className="mb-8 inline-block">
                        <span className="text-3xl font-black tracking-tight text-[#1B2A4A]">
                            Gala<span className="text-[#FF6B35]">Po</span>
                        </span>
                    </a>

                    <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        List your business for free and start reaching more customers.
                    </p>

                    <div className="mt-8">
                        <RegisterForm />
                    </div>

                    {/* Mobile Benefits */}
                    <div className="mt-10 block lg:hidden">
                        <h2 className="text-sm font-semibold text-gray-700">Why list on GalaPo?</h2>
                        <ul className="mt-3 space-y-2">
                            {BENEFITS.map((b) => (
                                <li key={b} className="flex items-start gap-2 text-sm text-gray-600">
                                    <CheckCircle size={16} className="mt-0.5 shrink-0 text-green-500" />
                                    {b}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Right — Marketing Panel (desktop only) */}
            <div className="hidden w-[40%] shrink-0 bg-[#1B2A4A] lg:flex lg:flex-col lg:justify-center lg:px-12 xl:px-16">
                <h2 className="text-2xl font-bold text-white">
                    Why List Your Business on GalaPo?
                </h2>

                <ul className="mt-8 space-y-4">
                    {BENEFITS.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-3">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/20">
                                <CheckCircle size={14} className="text-green-400" />
                            </div>
                            <span className="text-sm text-white/80">{benefit}</span>
                        </li>
                    ))}
                    <li className="flex items-start gap-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF6B35]/20">
                            <Star size={14} className="text-[#FF6B35]" />
                        </div>
                        <span className="text-sm text-white/80">
                            Upgrade to Featured or Premium for more visibility
                        </span>
                    </li>
                </ul>

                {/* Testimonial */}
                <div className="mt-12 rounded-2xl bg-white/10 p-6">
                    <p className="text-sm italic text-white/70">
                        &ldquo;GalaPo helped us reach new customers we never would have found otherwise.
                        Within weeks, our foot traffic increased noticeably.&rdquo;
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF6B35] text-sm font-bold text-white">
                            M
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">Maria Santos</p>
                            <p className="text-xs text-white/50">Owner, Kusina ni Maria</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-lg font-semibold text-[#FF6B35]">500+</p>
                    <p className="text-xs text-white/60">businesses already on GalaPo</p>
                </div>
            </div>
        </div>
    );
}
