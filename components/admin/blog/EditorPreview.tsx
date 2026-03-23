import type { BlogLinkedListing } from "@/lib/types";
import ArticleContent from "@/components/public/blog/ArticleContent";

interface EditorPreviewProps {
    title: string;
    excerpt?: string;
    featuredImageUrl?: string | null;
    content: string;
    linkedListings: BlogLinkedListing[];
    tags?: string[];
    authorName?: string;
    publishedAt?: string;
}

export default function EditorPreview({ 
    title, 
    featuredImageUrl, 
    content, 
    linkedListings,
    tags = [],
    authorName = "Author Name",
    publishedAt
}: EditorPreviewProps) {
    const displayDate = publishedAt ? new Date(publishedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    }) : "Date Published";

    return (
        <div className="rounded-[2rem] border border-border bg-card p-0 shadow-sm overflow-hidden flex flex-col h-full sticky top-6">
            <div className="border-b border-border bg-muted/30 px-6 py-3 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Live Desktop Preview</p>
                <div className="flex gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-border" />
                    <div className="h-2 w-2 rounded-full bg-border" />
                    <div className="h-2 w-2 rounded-full bg-border" />
                </div>
            </div>
            
            <div className="flex-1 overflow-auto bg-background p-8 sm:p-12">
                <div className="mx-auto max-w-2xl space-y-8 text-left">

                    <header className="space-y-6">
                        {/* Tags */}

                        <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl leading-[1.15]">
                            {title || "Post Title Preview"}
                        </h1>

                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                                {authorName.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-foreground text-xs uppercase tracking-widest">{authorName}</span>
                                <div className="flex items-center gap-2 text-xs opacity-60">
                                    <time>{displayDate}</time>
                                    <span>•</span>
                                    <span>5 min read</span>
                                </div>
                            </div>
                        </div>

                        {featuredImageUrl ? (
                            <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-muted ring-1 ring-border shadow-md">
                                <img src={featuredImageUrl} alt={title} className="h-full w-full object-cover" />
                            </div>
                        ) : (
                            <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-muted/50 border-2 border-dashed border-border flex items-center justify-center">
                                <span className="text-xs font-medium text-muted-foreground/40">Featured Image will appear here</span>
                            </div>
                        )}
                    </header>

                    <ArticleContent htmlContent={content || "<p>Start writing to see the actual content rendering...</p>"} linkedListings={linkedListings} />
                    
                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                                <span key={tag} className="rounded-full bg-muted px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}