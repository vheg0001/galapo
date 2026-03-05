"use client";

// ──────────────────────────────────────────────────────────
// GalaPo — ClaimForm Component (Module 9.1)
// ──────────────────────────────────────────────────────────

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, ShieldCheck, Mail, Phone, Info, Loader2 } from "lucide-react";
import { formatPhoneNumberInput } from "@/lib/utils";

interface ClaimFormProps {
    listing: {
        id: string;
        slug: string;
        business_name: string;
    };
}

export default function ClaimForm({ listing }: ClaimFormProps) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [contactPhone, setContactPhone] = useState("");
    const [notes, setNotes] = useState("");
    const [success, setSuccess] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("File is too large (max 5MB)");
                return;
            }
            setProofFile(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!proofFile) {
            setError("Please upload a proof of ownership document.");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("proof_file", proofFile);
            formData.append("phone", contactPhone);
            formData.append("notes", notes);

            const res = await fetch(`/api/claim/${listing.slug}`, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to submit claim.");

            setSuccess(true);
            setTimeout(() => {
                router.push("/business/dashboard?claimed=true");
            }, 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="mx-auto max-w-xl rounded-3xl border border-gray-100 bg-white p-12 text-center shadow-xl shadow-gray-200/50">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <ShieldCheck size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Claim Submitted!</h2>
                <p className="mt-4 text-gray-500 leading-relaxed">
                    Thank you for providing proof of ownership for <b>{listing.business_name}</b>.
                    Our verification team will review your documents within 24-48 hours.
                </p>
                <div className="mt-8 flex flex-col gap-3">
                    <div className="rounded-xl bg-gray-50 p-4 text-xs text-gray-400">
                        Redirecting you to your dashboard...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-xl rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/50">
            <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF6B35]/10 text-[#FF6B35]">
                    <ShieldCheck size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Claim This Business</h2>
                <p className="mt-2 text-sm text-gray-500">
                    Prove ownership of <b>{listing.business_name}</b> to start managing your profile and analytics.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="rounded-xl bg-red-50 p-4 text-xs font-medium text-red-500 border border-red-100 italic">
                        {error}
                    </div>
                )}

                {/* Proof of Ownership */}
                <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700">Proof of Ownership</label>
                    <div className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-colors ${proofFile ? "border-[#00A86B]/30 bg-[#00A86B]/5" : "border-gray-200 bg-gray-50/50 hover:bg-gray-50"
                        }`}>
                        {proofFile ? (
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-2 rounded-full bg-[#00A86B] p-2 text-white">
                                    <ShieldCheck size={20} />
                                </div>
                                <span className="text-sm font-bold text-gray-900">{proofFile.name}</span>
                                <span className="text-xs text-gray-500">{(proofFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                <button
                                    type="button"
                                    onClick={() => setProofFile(null)}
                                    className="mt-4 text-xs font-bold text-red-500 hover:underline"
                                >
                                    Remove File
                                </button>
                            </div>
                        ) : (
                            <>
                                <Upload className="mb-3 text-gray-300" size={32} />
                                <span className="text-sm font-bold text-gray-700">Click to upload document</span>
                                <span className="mt-1 text-xs text-gray-400">DTI, Mayor's Permit, or Electricity Bill (PDF, JPG, PNG)</span>
                                <input
                                    type="file"
                                    className="absolute inset-0 cursor-pointer opacity-0"
                                    onChange={handleFileChange}
                                    accept=".pdf,image/*"
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* Contact Phone */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700">Official Contact Number</label>
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="tel"
                            placeholder="0912 345 6789"
                            required
                            value={contactPhone}
                            onChange={(e) => setContactPhone(formatPhoneNumberInput(e.target.value))}
                            className="w-full rounded-xl border border-gray-100 bg-gray-50/50 py-3 pl-11 pr-4 text-sm transition focus:border-[#FF6B35] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/20"
                        />
                    </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700">Additional Notes (Optional)</label>
                    <span className="text-[10px] text-gray-400 block -mt-1 mb-1">Anything else we should know?</span>
                    <textarea
                        placeholder="Provide any additional info..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full resize-none rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-sm transition focus:border-[#FF6B35] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/20"
                    />
                </div>

                <div className="rounded-xl bg-blue-50 p-4 flex gap-3 text-blue-800">
                    <Info className="shrink-0" size={18} />
                    <p className="text-[11px] leading-relaxed">
                        Claims are typically reviewed within 24-48 hours. Once approved, you will gain full access to edit the listing and view insights.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B35] py-4 text-sm font-bold text-white shadow-lg shadow-[#FF6B35]/20 transition hover:bg-[#FF6B35]/90 active:scale-[0.98] disabled:opacity-50"
                >
                    {submitting ? <Loader2 className="animate-spin" size={20} /> : "Submit Claim Request"}
                </button>
            </form>
        </div>
    );
}
