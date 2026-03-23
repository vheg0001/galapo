import Link from "next/link";
import type { BlogPostCard } from "@/lib/types";
import LazyImage from "@/components/shared/LazyImage";
import ReadTime from "@/components/shared/ReadTime";
import { formatBlogPublishedDate } from "@/lib/blog-helpers";

interface FeaturedPostProps {
    post?: BlogPostCard | null;
}

export default function FeaturedPost({ post }: FeaturedPostProps) {
    if (!post) return null;

    return (
        <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="grid gap-0 lg:grid-cols-[1.35fr_minmax(0,1fr)]">
                <Link href={`/olongapo/blog/${post.slug}`} className="relative block min-h-[260px] bg-muted">
                    {post.featured_image_url ? (
                        <LazyImage
                            src={post.featured_image_url}
                            alt={post.title}
                            className="object-cover"
                            priority
                            sizes="(max-width: 1024px) 100vw, 60vw"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/5 text-center">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">GalaPo</p>
                                <p className="mt-2 text-2xl font-bold text-foreground">Featured Story</p>
                            </div>
                        </div>
                    )}
                </Link>

                <div className="flex flex-col justify-center p-6 lg:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-secondary">Featured Post</p>
                    <h2 className="mt-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                        <Link href={`/olongapo/blog/${post.slug}`} className="hover:text-secondary">
                            {post.title}
                        </Link>
                    </h2>
                    {post.excerpt && <p className="mt-4 text-sm leading-7 text-muted-foreground">{post.excerpt}</p>}

                    <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <div className="relative h-9 w-9 overflow-hidden rounded-full bg-muted">
                                {post.author.avatar_url ? (
                                    <LazyImage src={post.author.avatar_url} alt={post.author.name} className="object-cover" />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-sm font-bold text-primary">
                                        {post.author.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <span className="font-medium text-foreground">{post.author.name}</span>
                        </div>
                        <span>•</span>
                        <time>{formatBlogPublishedDate(post.published_at)}</time>
                        <span>•</span>
                        <ReadTime minutes={post.read_time} />
                    </div>

                    <div className="mt-6">
                        <Link
                            href={`/olongapo/blog/${post.slug}`}
                            className="inline-flex items-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            Read More
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}