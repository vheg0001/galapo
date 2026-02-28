"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — RegisterForm (Module 7.1)
// ──────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import PasswordStrengthIndicator, { getStrength } from "./PasswordStrengthIndicator";

// ── Philippine phone number validation ──────────────────
function validatePHPhone(phone: string): boolean {
    const cleaned = phone.replace(/\s|-/g, "");
    return /^(\+63|0)9\d{9}$/.test(cleaned);
}

// ── Field validation ────────────────────────────────────
function validateField(name: string, value: string, fields: Record<string, string>): string {
    switch (name) {
        case "fullName":
            return value.trim().length < 2 ? "Full name must be at least 2 characters" : "";
        case "email":
            return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "Please enter a valid email address" : "";
        case "phone":
            return !validatePHPhone(value) ? "Enter a valid PH number (09XX-XXX-XXXX or +63)" : "";
        case "password":
            return value.length < 8 ? "Password must be at least 8 characters" : "";
        case "confirmPassword":
            return value !== fields.password ? "Passwords do not match" : "";
        default:
            return "";
    }
}

export default function RegisterForm() {
    const router = useRouter();
    const { register } = useAuthStore();

    const [fields, setFields] = useState({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFields((prev) => ({ ...prev, [name]: value }));
        if (touched[name]) {
            const errMsg = validateField(name, value, { ...fields, [name]: value });
            setErrors((prev) => ({ ...prev, [name]: errMsg }));
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        const errMsg = validateField(name, value, fields);
        setErrors((prev) => ({ ...prev, [name]: errMsg }));
    };

    const isFormValid = () => {
        const allFilled = Object.values(fields).every((v) => v.trim() !== "");
        const noErrors = Object.values(errors).every((e) => e === "");
        const strength = getStrength(fields.password);
        return allFilled && noErrors && agreed && strength !== "weak";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError("");

        // Validate all on submit
        const newErrors: Record<string, string> = {};
        (Object.keys(fields) as (keyof typeof fields)[]).forEach((key) => {
            newErrors[key] = validateField(key, fields[key], fields);
        });
        setErrors(newErrors);
        setTouched({ fullName: true, email: true, phone: true, password: true, confirmPassword: true });

        if (Object.values(newErrors).some((e) => e)) return;

        setIsLoading(true);
        const { error } = await register(fields.email, fields.password, fields.fullName, fields.phone);
        setIsLoading(false);

        if (error) {
            setServerError(error);
            return;
        }

        router.push("/business/listings/new?welcome=1");
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {serverError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {serverError}
                </div>
            )}

            {/* Full Name */}
            <div>
                <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                </label>
                <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    value={fields.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Juan dela Cruz"
                    className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition
                        focus:ring-2 focus:ring-[#1B2A4A]/30
                        ${errors.fullName && touched.fullName
                            ? "border-red-400 bg-red-50"
                            : "border-gray-300 bg-white focus:border-[#1B2A4A]"
                        }`}
                />
                {errors.fullName && touched.fullName && (
                    <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
                )}
            </div>

            {/* Email */}
            <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={fields.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="juan@example.com"
                    className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition
                        focus:ring-2 focus:ring-[#1B2A4A]/30
                        ${errors.email && touched.email
                            ? "border-red-400 bg-red-50"
                            : "border-gray-300 bg-white focus:border-[#1B2A4A]"
                        }`}
                />
                {errors.email && touched.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
            </div>

            {/* Phone */}
            <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={fields.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="09XX-XXX-XXXX"
                    className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition
                        focus:ring-2 focus:ring-[#1B2A4A]/30
                        ${errors.phone && touched.phone
                            ? "border-red-400 bg-red-50"
                            : "border-gray-300 bg-white focus:border-[#1B2A4A]"
                        }`}
                />
                {errors.phone && touched.phone && (
                    <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                )}
            </div>

            {/* Password */}
            <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={fields.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Min. 8 characters"
                        className={`w-full rounded-lg border px-4 py-2.5 pr-11 text-sm outline-none transition
                            focus:ring-2 focus:ring-[#1B2A4A]/30
                            ${errors.password && touched.password
                                ? "border-red-400 bg-red-50"
                                : "border-gray-300 bg-white focus:border-[#1B2A4A]"
                            }`}
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
                {errors.password && touched.password && (
                    <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}
                <PasswordStrengthIndicator password={fields.password} />
            </div>

            {/* Confirm Password */}
            <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        autoComplete="new-password"
                        value={fields.confirmPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Re-enter password"
                        className={`w-full rounded-lg border px-4 py-2.5 pr-11 text-sm outline-none transition
                            focus:ring-2 focus:ring-[#1B2A4A]/30
                            ${errors.confirmPassword && touched.confirmPassword
                                ? "border-red-400 bg-red-50"
                                : "border-gray-300 bg-white focus:border-[#1B2A4A]"
                            }`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                {errors.confirmPassword && touched.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
                )}
                {!errors.confirmPassword && fields.confirmPassword && fields.confirmPassword === fields.password && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle size={12} /> Passwords match
                    </p>
                )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
                <input
                    id="agreed"
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#FF6B35] focus:ring-[#FF6B35]"
                />
                <label htmlFor="agreed" className="text-sm text-gray-600">
                    I agree to the{" "}
                    <Link href="/terms" target="_blank" className="text-[#FF6B35] underline hover:text-[#e55a25]">
                        Terms & Conditions
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" target="_blank" className="text-[#FF6B35] underline hover:text-[#e55a25]">
                        Privacy Policy
                    </Link>
                </label>
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={!isFormValid() || isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF6B35] px-6 py-3 text-sm font-semibold text-white transition
                    hover:bg-[#e55a25] active:scale-[0.98]
                    disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isLoading ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        Creating account…
                    </>
                ) : (
                    "Create Account"
                )}
            </button>

            <p className="text-center text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-[#1B2A4A] hover:text-[#FF6B35]">
                    Login here
                </Link>
            </p>
        </form>
    );
}
