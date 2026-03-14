import type { Metadata } from "next";
import BlogIndexPage from "@/components/public/blog/BlogIndexPage";
import { getPopularBlogPosts, getPublishedBlogPosts } from "@/lib/blog-helpers";

interface PageProps {
    params: Promise<{ tag: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { tag } = await params;
    return {
        title: `Articles about ${decodeURIComponent(tag)} in Olongapo City | GalaPo Blog`,
        description: `Browse blog posts and local stories about ${decodeURIComponent(tag)} in Olongapo City on GalaPo.`,
    };
}

export default async function BlogTagPage({ params, searchParams }: PageProps) {
    const { tag } = await params;
    const resolvedTag = decodeURIComponent(tag);
    const query = await searchParams;
    const page = Number(typeof query.page === "string" ? query.page : "1");

    const [postsResult, popularPosts] = await Promise.all([
        getPublishedBlogPosts({ page, limit: 10, tag: resolvedTag }),
        getPopularBlogPosts(5),
    ]);

    return (
        <BlogIndexPage
            title={`Posts tagged: ${resolvedTag}`}
            subtitle={`Articles and local stories filed under ${resolvedTag}.`}
            posts={postsResult.data}
            featuredPost={null}
            tags={postsResult.tags}
            activeTag={resolvedTag}
            popularPosts={popularPosts}
            pagination={{ totalPages: postsResult.pagination.totalPages, page: postsResult.pagination.page }}
            basePath={`/olongapo/blog/tag/${encodeURIComponent(resolvedTag)}`}
        />
    );
}