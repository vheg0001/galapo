"use client";

import { useState } from "react";
import { 
    ZoomIn, 
    ZoomOut, 
    Download, 
    ExternalLink, 
    Maximize2, 
    FileText,
    ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProofViewerProps {
    url: string | null;
    fileName?: string;
}

export default function ProofViewer({ url, fileName }: ProofViewerProps) {
    const [zoom, setZoom] = useState(1);
    const [isImage, setIsImage] = useState(true); // Default to true, update based on URL extension

    if (!url) {
        return (
            <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
                <ImageIcon className="h-12 w-12 opacity-20" />
                <p className="mt-2 text-sm font-medium">No proof uploaded</p>
            </div>
        );
    }

    const isPdf = url.toLowerCase().endsWith(".pdf");

    return (
        <div className="flex flex-col gap-4">
            <div className="relative aspect-auto min-h-[400px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 group">
                {isPdf ? (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 p-8 text-center text-slate-500">
                        <FileText className="mb-4 h-16 w-16 text-slate-400" />
                        <h4 className="text-lg font-black text-slate-900">PDF Document</h4>
                        <p className="mt-1 text-sm font-medium">This proof is a PDF file. Use the buttons below to view or download it.</p>
                        <Button variant="default" className="mt-6 rounded-xl bg-slate-900" asChild>
                            <a href={url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open PDF in New Tab
                            </a>
                        </Button>
                    </div>
                ) : (
                    <div className="h-full w-full overflow-auto bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                        <img
                            src={url}
                            alt="Payment Proof"
                            className="mx-auto block h-auto max-w-none transition-transform duration-200 ease-out"
                            style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
                        />
                    </div>
                )}

                {/* Floating Controls for Images */}
                {!isPdf && (
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-white/90 p-2 shadow-2xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl" onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}>
                            <ZoomOut className="h-5 w-5" />
                        </Button>
                        <span className="w-12 text-center text-xs font-black text-slate-900">{Math.round(zoom * 100)}%</span>
                        <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl" onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}>
                            <ZoomIn className="h-5 w-5" />
                        </Button>
                        <div className="mx-1 h-6 w-px bg-slate-200" />
                        <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl" onClick={() => setZoom(1)}>
                            <Maximize2 className="h-5 w-5" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500 italic">
                    File: {fileName || url.split("/").pop()}
                </p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl border-slate-200" asChild>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open Original
                        </a>
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl border-slate-200" asChild>
                        <a href={url} download={fileName || "payment-proof"}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    );
}
