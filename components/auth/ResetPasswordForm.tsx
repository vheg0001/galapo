"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — ResetPasswordForm (Module 7.1)
// ──────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import PasswordStrengthIndicator, { getStrength } from "./PasswordStrengthIndicator";

export default function ResetPasswordForm() {
    const router = useRouter();
    const { updatePassword } = useAuthStore();

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const strength = getStrength(password);
    const isValid =
        password.length >= 8 &&
        password === confirm &&
        strength !== "weak";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!isValid) return;

        setIsLoading(true);
        const { error: updateError } = await updatePassword(password);
        setIsLoading(false);

        if (updateError) {
            setError(updateError);
            return;
        }

        router.push("/login?reset=success");
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* New Password */}
            <div>
                <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-gray-700">
                    New Password
                </label>
                <div className="relative">
                    <input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-11 text-sm outline-none transition
                            focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/30"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label="Toggle password visibility"
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                <PasswordStrengthIndicator password={password} />
            </div>

            {/* Confirm Password */}
            <div>
                <label htmlFor="confirm-new-password" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Confirm New Password
                </label>
                <div className="relative">
                    <input
                        id="confirm-new-password"
                        type={showConfirm ? "text" : "password"}
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Re-enter new password"
                        className={`w-full rounded-lg border px-4 py-2.5 pr-11 text-sm outline-none transition
                            focus:ring-2 focus:ring-[#1B2A4A]/30
                            ${confirm && confirm !== password
                                ? "border-red-400 bg-red-50 focus:border-red-400"
                                : "border-gray-300 bg-white focus:border-[#1B2A4A]"
                            }`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label="Toggle password visibility"
                    >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                {confirm && confirm !== password && (
                    <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                )}
            </div>

            <button
                type="submit"
                disabled={!isValid || isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF6B35] px-6 py-3 text-sm font-semibold text-white transition
                    hover:bg-[#e55a25] active:scale-[0.98]
                    disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isLoading ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        Resetting password…
                    </>
                ) : (
                    "Reset Password"
                )}
            </button>
        </form>
    );
}
