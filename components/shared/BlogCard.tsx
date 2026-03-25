import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatBlogPublishedDate } from "@/lib/blog-helpers";
import ReadTime from "@/components/shared/ReadTime";
import LazyImage from "./LazyImage";

interface BlogCardProps {
    slug: string;
    title: string;
    excerpt?: string | null;
    featuredImageUrl?: string | null;
    publishedAt?: string | null;
    authorName?: string | null;
    authorAvatarUrl?: string | null;
    tags?: string[];
    readTime?: number | null;
    className?: string;
    priority?: boolean;
}

export default function BlogCard({
    slug,
    title,
    excerpt,
    featuredImageUrl,
    publishedAt,
    authorName,
    authorAvatarUrl,
    tags = [],
    readTime,
    className,
    priority = false,
}: BlogCardProps) {
    const href = `/olongapo/blog/${slug}`;
    const visibleTags = tags.slice(0, 2);

    return (
        <article
            className={cn(
                "group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg",
                className
            )}
        >
            <Link href={href} className="block">
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                    {featuredImageUrl ? (
                        <LazyImage
                            src={featuredImageUrl}
                            alt={title}
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            priority={priority}
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/5 text-center">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">GalaPo</p>
                                <p className="mt-2 text-lg font-bold text-foreground">Olongapo Stories</p>
                            </div>
                        </div>
                    )}
                </div>
            </Link>

            <div className="flex flex-1 flex-col p-5">
                {visibleTags.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                        {visibleTags.map((tag) => (
                            <Link
                                key={tag}
                                href={`/olongapo/blog/tag/${encodeURIComponent(tag)}`}
                                className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/15"
                            >
                                {tag}
                            </Link>
                        ))}
                    </div>
                )}

                <h3 className="text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-secondary">
                    <Link href={href}>{title}</Link>
                </h3>

                {excerpt && (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{excerpt}</p>
                )}

                <div className="mt-auto pt-5 flex items-center justify-between gap-4 text-xs text-muted-foreground">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="relative h-9 w-9 overflow-hidden rounded-full bg-muted">
                            {authorAvatarUrl ? (
                                <LazyImage src={authorAvatarUrl} alt={authorName || "Author"} className="object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-primary">
                                    {(authorName || "G").charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{authorName || "GalaPo Team"}</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <time>{formatBlogPublishedDate(publishedAt)}</time>
                                {readTime ? (
                                    <>
                                        <span aria-hidden="true">•</span>
                                        <ReadTime minutes={readTime} />
                                    </>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <Link href={href} className="text-sm font-semibold text-secondary transition-colors hover:underline">
                        Read More →
                    </Link>
                </div>
            </div>
        </article>
    );
}
