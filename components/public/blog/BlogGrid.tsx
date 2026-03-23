import AdSlot from "@/components/shared/AdSlot";
import BlogCard from "@/components/shared/BlogCard";
import type { BlogPostCard } from "@/lib/types";

interface BlogGridProps {
    posts: BlogPostCard[];
}

export default async function BlogGrid({ posts }: BlogGridProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post, index) => (
                <div key={post.id} className="contents">
                    <BlogCard
                        slug={post.slug}
                        title={post.title}
                        excerpt={post.excerpt}
                        featuredImageUrl={post.featured_image_url}
                        publishedAt={post.published_at}
                        authorName={post.author.name}
                        authorAvatarUrl={post.author.avatar_url}
                        tags={post.tags}
                        readTime={post.read_time}
                    />
                    {(index + 1) % 4 === 0 ? (
                        <div className="md:col-span-2">
                            <AdSlot location="blog_inline" className="rounded-2xl border border-dashed border-border bg-muted/20 p-3" />
                        </div>
                    ) : null}
                </div>
            ))}
        </div>
    );
}