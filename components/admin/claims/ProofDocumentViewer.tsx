"use client";

interface ProofDocumentViewerProps {
    url?: string | null;
}

export default function ProofDocumentViewer({ url }: ProofDocumentViewerProps) {
    if (!url) return <p className="text-sm text-muted-foreground">No proof document uploaded.</p>;

    const isImage = /\.(png|jpe?g|webp|gif)$/i.test(url);
    const isPdf = /\.pdf$/i.test(url);

    return (
        <div className="space-y-2">
            {isImage && <img src={url} alt="Claim proof" className="max-h-80 w-full rounded-lg border border-border object-contain" />}
            {isPdf && <iframe src={url} title="Claim proof PDF" className="h-96 w-full rounded-lg border border-border" />}
            {!isImage && !isPdf && <p className="text-sm text-muted-foreground">Preview not available for this file type.</p>}
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-600 underline">
                Download / Open Proof Document
            </a>
        </div>
    );
}
