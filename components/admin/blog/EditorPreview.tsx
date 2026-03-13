import type { BlogLinkedListing } from "@/lib/types";
import ArticleContent from "@/components/public/blog/ArticleContent";

interface EditorPreviewProps {
    title: string;
    excerpt: string;
    featuredImageUrl?: string | null;
    content: string;
    linkedListings: BlogLinkedListing[];
}

export default function EditorPreview({ title, excerpt, featuredImageUrl, content, linkedListings }: EditorPreviewProps) {
    return (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Live Preview</p>
            <div className="mt-4 space-y-4">
                {featuredImageUrl ? <img src={featuredImageUrl} alt={title} className="aspect-[16/9] w-full rounded-2xl object-cover" /> : null}
                <h2 className="text-2xl font-black tracking-tight text-foreground">{title || "Post title preview"}</h2>
                {excerpt ? <p className="text-sm leading-7 text-muted-foreground">{excerpt}</p> : null}
                <ArticleContent htmlContent={content || "<p>Start writing to see the preview...</p>"} linkedListings={linkedListings} />
            </div>
        </div>
    );
}