"use client";

interface SEOPreviewProps {
    title?: string;
    description?: string;
    slug?: string;
}

export default function SEOPreview({ title, description, slug }: SEOPreviewProps) {
    const baseUrl = (typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL) || "https://galapo.ph";
    const url = `${baseUrl}/olongapo/blog/${slug || "sample-post"}`;
    const previewTitle = (title || "Sample blog title preview").slice(0, 70);
    const previewDescription = (description || "Your meta description preview will appear here and help people understand what the article is about.").slice(0, 160);

    return (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">SEO Preview</p>
            <div className="mt-4 rounded-xl border border-border/70 bg-background p-4">
                <p className="truncate text-xs text-emerald-700">{url}</p>
                <p className="mt-1 text-xl leading-snug text-blue-700">{previewTitle}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{previewDescription}</p>
            </div>
            <div className="mt-4 grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
                <p>Title: {(title || "").length}/70</p>
                <p>Description: {(description || "").length}/160</p>
            </div>
        </div>
    );
}