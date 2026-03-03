"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — PasswordForm (Module 8.1)
// ──────────────────────────────────────────────────────────

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

function PasswordStrength({ password }: { password: string }) {
    const score = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length;

    const labels = ["", "Weak", "Fair", "Good", "Strong"];
    const colors = ["", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"];

    if (!password) return null;
    return (
        <div className="mt-2 space-y-1">
            <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition ${i <= score ? colors[score] : "bg-gray-100"}`}
                    />
                ))}
            </div>
            <p className="text-xs text-gray-400">
                Strength: <span className="font-medium">{labels[score]}</span>
            </p>
        </div>
    );
}

function PasswordInput({
    id,
    label,
    value,
    onChange,
    placeholder,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    const [show, setShow] = useState(false);
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
            <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                    id={id}
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder ?? "••••••••"}
                    required
                    className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 transition"
                />
                <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
        </div>
    );
}

export default function PasswordForm() {
    const { updatePassword } = useAuthStore();
    const [currentPass, setCurrentPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPass !== confirmPass) {
            setErrorMsg("Passwords do not match.");
            setStatus("error");
            return;
        }
        if (newPass.length < 8) {
            setErrorMsg("Password must be at least 8 characters.");
            setStatus("error");
            return;
        }

        setSaving(true);
        setStatus("idle");

        try {
            const { error } = await updatePassword(newPass);
            if (error) throw new Error(error);
            setStatus("success");
            setCurrentPass("");
            setNewPass("");
            setConfirmPass("");
            setTimeout(() => setStatus("idle"), 3000);
        } catch (err: any) {
            setErrorMsg(err.message ?? "Failed to update password.");
            setStatus("error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <PasswordInput
                id="currentPass"
                label="Current Password"
                value={currentPass}
                onChange={setCurrentPass}
                placeholder="Enter current password"
            />

            <div>
                <PasswordInput
                    id="newPass"
                    label="New Password"
                    value={newPass}
                    onChange={setNewPass}
                    placeholder="Minimum 8 characters"
                />
                <PasswordStrength password={newPass} />
            </div>

            <PasswordInput
                id="confirmPass"
                label="Confirm New Password"
                value={confirmPass}
                onChange={setConfirmPass}
                placeholder="Repeat new password"
            />

            {status === "success" && (
                <div className="rounded-lg bg-green-50 border border-green-100 px-4 py-3 text-sm font-medium text-green-700">
                    ✅ Password updated successfully.
                </div>
            )}
            {status === "error" && (
                <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-700">
                    ❌ {errorMsg}
                </div>
            )}

            <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#243461] disabled:opacity-50"
            >
                {saving ? "Updating…" : "Update Password"}
            </button>
        </form>
    );
}
