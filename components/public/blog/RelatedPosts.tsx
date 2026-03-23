import type { BlogPostCard } from "@/lib/types";
import BlogCard from "@/components/shared/BlogCard";

interface RelatedPostsProps {
    posts: BlogPostCard[];
}

export default function RelatedPosts({ posts }: RelatedPostsProps) {
    if (posts.length === 0) return null;

    return (
        <section className="space-y-5">
            <div>
                <h2 className="text-2xl font-black tracking-tight text-foreground">You Might Also Like</h2>
                <p className="mt-1 text-sm text-muted-foreground">More stories, guides, and local insights from GalaPo.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
                {posts.map((post) => (
                    <BlogCard
                        key={post.id}
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
                ))}
            </div>
        </section>
    );
}