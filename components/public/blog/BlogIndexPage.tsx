import Pagination from "@/components/shared/Pagination";
import AdSlot from "@/components/shared/AdSlot";
import FeaturedPost from "@/components/public/blog/FeaturedPost";
import TagCloud from "@/components/public/blog/TagCloud";
import BlogGrid from "@/components/public/blog/BlogGrid";
import BlogSidebar from "@/components/public/blog/BlogSidebar";
import type { BlogPostCard, TagCount } from "@/lib/types";

interface BlogIndexPageProps {
    title?: string;
    subtitle: string;
    posts: BlogPostCard[];
    featuredPost?: BlogPostCard | null;
    tags: TagCount[];
    activeTag?: string | null;
    popularPosts: BlogPostCard[];
    pagination?: {
        totalPages: number;
        page: number;
    };
    basePath?: string;
}

export default async function BlogIndexPage({
    title = "GalaPo Blog",
    subtitle,
    posts,
    featuredPost,
    tags,
    activeTag,
    popularPosts,
    pagination,
    basePath = "/olongapo/blog",
}: BlogIndexPageProps) {
    const paginationBasePath = activeTag && basePath.includes("/tag/")
        ? basePath
        : `${basePath}${activeTag ? `${basePath.includes("?") ? "&" : "?"}tag=${encodeURIComponent(activeTag)}` : ""}`;

    return (
        <main className="min-h-screen bg-background">
            <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8 space-y-3">
                    <h1 className="text-4xl font-black tracking-tight text-foreground">{title}</h1>
                    <p className="max-w-2xl text-base text-muted-foreground">{subtitle}</p>
                </div>

                <AdSlot location="category_banner" className="mb-8 overflow-hidden rounded-2xl" priority />

                <div className="space-y-8">
                    <FeaturedPost post={featuredPost} />

                    <div className="overflow-x-auto pb-2">
                        <TagCloud tags={tags} activeTag={activeTag} basePath={basePath} showAllChip />
                    </div>

                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="space-y-8">
                            <BlogGrid posts={posts} />
                            {pagination && pagination.totalPages > 1 ? (
                                <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} basePath={paginationBasePath} className="justify-start" />
                            ) : null}
                        </div>
                        <BlogSidebar popularPosts={popularPosts} tags={tags} />
                    </div>
                </div>
            </div>
        </main>
    );
}