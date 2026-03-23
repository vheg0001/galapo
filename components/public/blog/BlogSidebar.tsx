import Link from "next/link";
import AdSlot from "@/components/shared/AdSlot";
import type { BlogPostCard, TagCount } from "@/lib/types";

interface BlogSidebarProps {
    popularPosts: BlogPostCard[];
    tags: TagCount[];
    categories?: Array<{ name: string; count: number }>;
}

export default async function BlogSidebar({ popularPosts, tags, categories = [] }: BlogSidebarProps) {
    return (
        <aside className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-lg font-bold text-foreground">Popular Posts</h3>
                <div className="mt-4 space-y-4">
                    {popularPosts.map((post) => (
                        <Link key={post.id} href={`/olongapo/blog/${post.slug}`} className="block group">
                            <p className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-secondary">{post.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{post.view_count ?? 0} views</p>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-lg font-bold text-foreground">Tags</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                        <Link
                            key={tag.tag}
                            href={`/olongapo/blog/tag/${encodeURIComponent(tag.tag)}`}
                            className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                        >
                            {tag.tag} ({tag.count})
                        </Link>
                    ))}
                </div>
            </section>

            {categories.length > 0 ? (
                <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <h3 className="text-lg font-bold text-foreground">Categories</h3>
                    <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                        {categories.map((category) => (
                            <li key={category.name} className="flex items-center justify-between">
                                <span>{category.name}</span>
                                <span>{category.count}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}

            <section className="rounded-2xl border border-dashed border-border bg-muted/20 p-5 shadow-sm">
                <h3 className="text-lg font-bold text-foreground">Newsletter</h3>
                <p className="mt-2 text-sm text-muted-foreground">Newsletter signup coming soon. Stay tuned for local stories, food guides, and business tips.</p>
            </section>

            <AdSlot location="blog_sidebar" className="overflow-hidden rounded-2xl" />
        </aside>
    );
}