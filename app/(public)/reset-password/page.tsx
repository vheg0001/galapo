import type { Metadata } from "next";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Create New Password | GalaPo",
    description: "Set a new password for your GalaPo business account.",
    robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-4 py-12">
            <div className="w-full max-w-[480px]">
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                    {/* Logo */}
                    <div className="mb-8 text-center">
                        <Link href="/" className="inline-block">
                            <span className="text-3xl font-black tracking-tight text-[#1B2A4A]">
                                Gala<span className="text-[#FF6B35]">Po</span>
                            </span>
                        </Link>
                        <h1 className="mt-4 text-2xl font-bold text-gray-900">Create New Password</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Choose a strong password for your account.
                        </p>
                    </div>

                    <ResetPasswordForm />
                </div>
            </div>
        </div>
    );
}
