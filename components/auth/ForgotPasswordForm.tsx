"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — ForgotPasswordForm (Module 7.1)
// ──────────────────────────────────────────────────────────

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function ForgotPasswordForm() {
    const { resetPassword } = useAuthStore();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        setIsLoading(true);
        const { error: resetError } = await resetPassword(email);
        setIsLoading(false);

        if (resetError) {
            setError(
                resetError.includes("rate limit")
                    ? "Too many attempts. Please try again later."
                    : "If that email exists, you'll receive a reset link."
            );
            return;
        }

        setSuccess(true);
    };

    if (success) {
        return (
            <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Check your email</h2>
                <p className="mt-2 text-sm text-gray-600">
                    We've sent a password reset link to{" "}
                    <strong className="text-gray-900">{email}</strong>. It may take a few minutes.
                </p>
                <p className="mt-4 text-xs text-gray-500">
                    Didn't receive it? Check your spam folder or{" "}
                    <button
                        onClick={() => { setSuccess(false); setEmail(""); }}
                        className="text-[#FF6B35] hover:underline"
                    >
                        try again
                    </button>.
                </p>
                <Link
                    href="/login"
                    className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-[#1B2A4A] hover:text-[#FF6B35]"
                >
                    <ArrowLeft size={14} /> Back to Login
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="forgot-email" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Email Address
                </label>
                <input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your account email"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition
                        focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/30"
                />
            </div>

            <button
                type="submit"
                disabled={!email.trim() || isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF6B35] px-6 py-3 text-sm font-semibold text-white transition
                    hover:bg-[#e55a25] active:scale-[0.98]
                    disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isLoading ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        Sending reset link…
                    </>
                ) : (
                    "Send Reset Link"
                )}
            </button>

            <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
                <ArrowLeft size={14} /> Back to Login
            </Link>
        </form>
    );
}
