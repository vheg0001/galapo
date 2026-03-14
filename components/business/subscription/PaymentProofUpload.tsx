"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, FileText, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PaymentProofUploadProps {
    onFileSelect: (file: File | null) => void;
    onReferenceChange: (ref: string) => void;
    referenceNumber: string;
    error?: string | null;
}

export default function PaymentProofUpload({ onFileSelect, onReferenceChange, referenceNumber, error }: PaymentProofUploadProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isPDF, setIsPDF] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const referenceInputId = "payment-reference-number";
    const proofInputId = "payment-proof-upload";

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            setFileName(file.name);
            const isPdfFile = file.type === "application/pdf";
            setIsPDF(isPdfFile);
            
            if (isPdfFile) {
                setPreviewUrl(null);
            } else {
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
            }
            onFileSelect(file);
        }
    };

    const clearFile = () => {
        setFileName(null);
        setPreviewUrl(null);
        setIsPDF(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onFileSelect(null);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <Label htmlFor={referenceInputId} className="text-xs font-black uppercase tracking-widest text-slate-400">1. Reference Number</Label>
                <Input
                    id={referenceInputId}
                    placeholder="Enter the transaction reference number"
                    value={referenceNumber}
                    onChange={(e) => onReferenceChange(e.target.value)}
                    className="rounded-2xl border-slate-200 py-6 text-sm font-semibold focus-visible:ring-slate-900"
                />
                <p className="text-[10px] font-bold text-slate-400 italic">Optional but highly recommended for faster verification.</p>
            </div>

            <div className="space-y-3">
                <Label htmlFor={proofInputId} className="text-xs font-black uppercase tracking-widest text-slate-400">2. Upload Proof of Payment</Label>
                
                {fileName ? (
                    <div className="relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-white p-4 shadow-sm">
                        <button
                            type="button"
                            onClick={clearFile}
                            aria-label="Clear selected file"
                            className="absolute right-4 top-4 z-10 rounded-full bg-slate-900/10 p-1.5 text-slate-900 transition hover:bg-slate-900 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="flex flex-col items-center">
                            {isPDF ? (
                                <div className="flex flex-col items-center py-8">
                                    <div className="mb-4 rounded-2xl bg-rose-50 p-4 text-rose-500">
                                        <FileText className="h-10 w-10" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-900">{fileName}</p>
                                    <p className="text-xs font-medium text-slate-500">PDF Document selected</p>
                                </div>
                            ) : (
                                <div className="w-full">
                                    <div className="mb-4 aspect-video w-full overflow-hidden rounded-2xl bg-slate-100">
                                        {previewUrl && <img src={previewUrl} alt="Payment proof preview" className="h-full w-full object-contain" />}
                                    </div>
                                    <p className="text-center text-sm font-bold text-slate-900">{fileName}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <label
                        htmlFor={proofInputId}
                        className={cn(
                            "group flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white py-12 transition-all hover:border-blue-500 hover:bg-blue-50/30",
                            error && "border-rose-300 bg-rose-50/30"
                        )}
                    >
                        <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
                            <Upload className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-900">Click to upload receipt</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">JPG, PNG or PDF (max 10MB)</p>
                        <input
                            id={proofInputId}
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </label>
                )}

                {error && (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-600 border border-rose-100">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
