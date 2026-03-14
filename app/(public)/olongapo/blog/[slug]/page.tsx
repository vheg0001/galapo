import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReadTime from "@/components/shared/ReadTime";
import LazyImage from "@/components/shared/LazyImage";
import SocialShareButtons from "@/components/shared/SocialShareButtons";
import ArticleContent from "@/components/public/blog/ArticleContent";
import TableOfContents from "@/components/public/blog/TableOfContents";
import AuthorBio from "@/components/public/blog/AuthorBio";
import LinkedListingsSection from "@/components/public/blog/LinkedListingsSection";
import RelatedPosts from "@/components/public/blog/RelatedPosts";
import AdSlot from "@/components/shared/AdSlot";
import { buildCanonicalBlogUrl, formatBlogPublishedDate, getBlogPostDetailBySlug } from "@/lib/blog-helpers";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = await getBlogPostDetailBySlug(slug);
    if (!post) return { title: "Post Not Found" };

    return {
        title: post.meta_title || `${post.title} | GalaPo Blog`,
        description: post.meta_description || post.excerpt || "GalaPo Blog post",
        alternates: {
            canonical: buildCanonicalBlogUrl(post.slug),
        },
        openGraph: {
            title: post.meta_title || `${post.title} | GalaPo Blog`,
            description: post.meta_description || post.excerpt || "GalaPo Blog post",
            type: "article",
            publishedTime: post.published_at || post.created_at,
            authors: [post.author.name],
            images: post.featured_image_url ? [{ url: post.featured_image_url }] : [],
        },
        twitter: {
            card: "summary_large_image",
            title: post.meta_title || `${post.title} | GalaPo Blog`,
            description: post.meta_description || post.excerpt || "GalaPo Blog post",
            images: post.featured_image_url ? [post.featured_image_url] : [],
        },
    };
}

export default async function BlogPostPage({ params }: PageProps) {
    const { slug } = await params;
    const post = await getBlogPostDetailBySlug(slug, { incrementView: true });
    if (!post) notFound();

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        image: post.featured_image_url,
        datePublished: post.published_at,
        dateModified: post.updated_at,
        author: { "@type": "Person", name: post.author.name },
        publisher: { "@type": "Organization", name: "GalaPo" },
        description: post.excerpt,
        mainEntityOfPage: buildCanonicalBlogUrl(post.slug),
    };

    const pageUrl = buildCanonicalBlogUrl(post.slug);

    return (
        <main className="min-h-screen bg-background pb-16">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid gap-10 lg:grid-cols-[minmax(0,768px)_280px] lg:items-start lg:justify-center">
                    <div className="mx-auto w-full max-w-3xl space-y-8">
                        <header className="space-y-5">

                            <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">{post.title}</h1>

                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                <div className="relative h-10 w-10 overflow-hidden rounded-full bg-muted">
                                    {post.author.avatar_url ? <LazyImage src={post.author.avatar_url} alt={post.author.name} className="object-cover" /> : <div className="flex h-full items-center justify-center text-sm font-bold text-primary">{post.author.name.charAt(0)}</div>}
                                </div>
                                <span className="font-medium text-foreground">{post.author.name}</span>
                                <span>•</span>
                                <time>{formatBlogPublishedDate(post.published_at)}</time>
                                <span>•</span>
                                <ReadTime minutes={post.read_time} />
                            </div>

                            {post.featured_image_url ? (
                                <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-muted">
                                    <LazyImage src={post.featured_image_url} alt={post.title} className="object-cover" priority sizes="(max-width: 1024px) 100vw, 768px" />
                                </div>
                            ) : null}
                        </header>

                        <ArticleContent htmlContent={post.content} linkedListings={post.linked_listings} />

                        <div className="space-y-5">
                            <div className="flex flex-wrap gap-2">
                                {post.tags.map((tag) => (
                                    <Link key={tag} href={`/olongapo/blog/tag/${encodeURIComponent(tag)}`} className="rounded-full bg-muted px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground/70 transition-all hover:bg-primary/10 hover:text-primary">
                                        {tag}
                                    </Link>
                                ))}
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
                                <h2 className="text-lg font-bold text-foreground">Share this article</h2>
                                <SocialShareButtons url={pageUrl} title={post.title} />
                            </div>
                            <AuthorBio author={post.author} />
                        </div>

                        <LinkedListingsSection listings={post.linked_listings} />
                        <RelatedPosts posts={post.related_posts} />

                        <AdSlot location="blog_inline" className="rounded-2xl border border-dashed border-border bg-muted/20 p-3" />

                        <section className="rounded-2xl border border-dashed border-border bg-muted/20 p-5 text-center shadow-sm">
                            <h2 className="text-xl font-bold text-foreground">Comments coming soon!</h2>
                            <p className="mt-2 text-sm text-muted-foreground">We&apos;re preparing community discussion features for future GalaPo Blog updates.</p>
                        </section>
                    </div>

                    <aside className="sticky top-24 space-y-6">
                        <TableOfContents headings={post.headings} />
                        <AdSlot location="blog_sidebar" className="hidden overflow-hidden rounded-2xl lg:block" />
                    </aside>
                </div>
            </div>
        </main>
    );
}