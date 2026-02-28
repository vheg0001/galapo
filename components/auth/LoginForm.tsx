"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — LoginForm (Module 7.1)
// ──────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function LoginForm() {
    const router = useRouter();
    const { login } = useAuthStore();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const isFormValid = email.trim() !== "" && password.trim() !== "";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        const { error: authError } = await login(email, password);
        setIsLoading(false);

        if (authError) {
            setError("Invalid email or password. Please try again.");
            return;
        }

        router.push("/business/dashboard");
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Email */}
            <div>
                <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Email Address
                </label>
                <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="juan@example.com"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition
                        focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/30"
                />
            </div>

            {/* Password */}
            <div>
                <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="login-password" className="text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <Link
                        href="/forgot-password"
                        className="text-xs text-[#FF6B35] hover:text-[#e55a25] hover:underline"
                    >
                        Forgot Password?
                    </Link>
                </div>
                <div className="relative">
                    <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-11 text-sm outline-none transition
                            focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/30"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF6B35] px-6 py-3 text-sm font-semibold text-white transition
                    hover:bg-[#e55a25] active:scale-[0.98]
                    disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isLoading ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        Logging in…
                    </>
                ) : (
                    "Login"
                )}
            </button>

            <p className="text-center text-sm text-gray-500">
                Don't have an account?{" "}
                <Link href="/register" className="font-medium text-[#1B2A4A] hover:text-[#FF6B35]">
                    Register your business
                </Link>
            </p>
        </form>
    );
}
