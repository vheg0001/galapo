import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
    title: "Business Owner Login | GalaPo",
    description: "Login to your GalaPo business dashboard to manage your listing.",
    robots: { index: false, follow: false },
};

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-4 py-12">
            <div className="w-full max-w-[480px]">
                {/* Card */}
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                    {/* Logo */}
                    <div className="mb-8 text-center">
                        <a href="/" className="inline-block">
                            <span className="text-3xl font-black tracking-tight text-[#1B2A4A]">
                                Gala<span className="text-[#FF6B35]">Po</span>
                            </span>
                        </a>
                        <h1 className="mt-4 text-2xl font-bold text-gray-900">Welcome Back</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Login to manage your business listing
                        </p>
                    </div>

                    <LoginForm />
                </div>

                <p className="mt-6 text-center text-xs text-gray-400">
                    Protected by GalaPo·{" "}
                    <a href="/privacy" className="underline hover:text-gray-600">
                        Privacy Policy
                    </a>
                </p>
            </div>
        </div>
    );
}
