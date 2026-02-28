"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — PasswordStrengthIndicator (Module 7.1)
// ──────────────────────────────────────────────────────────

interface PasswordStrengthIndicatorProps {
    password: string;
}

type Strength = "empty" | "weak" | "medium" | "strong";

function getStrength(password: string): Strength {
    if (!password) return "empty";
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return "weak";
    if (score <= 3) return "medium";
    return "strong";
}

const config: Record<Exclude<Strength, "empty">, { label: string; color: string; bars: number }> = {
    weak: { label: "Weak", color: "bg-red-500", bars: 1 },
    medium: { label: "Medium", color: "bg-yellow-500", bars: 2 },
    strong: { label: "Strong", color: "bg-green-500", bars: 3 },
};

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
    const strength = getStrength(password);

    if (strength === "empty") return null;

    const { label, color, bars } = config[strength];

    return (
        <div className="mt-2 space-y-1.5">
            <div className="flex gap-1.5">
                {[1, 2, 3].map((bar) => (
                    <div
                        key={bar}
                        data-testid="strength-bar"
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${bar <= bars ? color : "bg-gray-200"
                            }`}
                    />
                ))}
            </div>
            <p className={`text-xs font-medium ${strength === "weak" ? "text-red-600"
                : strength === "medium" ? "text-yellow-600"
                    : "text-green-600"
                }`}>
                {label} password
                {strength === "weak" && " — add uppercase, numbers, or symbols"}
                {strength === "medium" && " — add more variety to strengthen it"}
                {strength === "strong" && " — great choice!"}
            </p>
        </div>
    );
}

export { getStrength };
