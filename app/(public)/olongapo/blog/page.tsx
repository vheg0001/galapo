import type { Metadata } from "next";
import BlogIndexPage from "@/components/public/blog/BlogIndexPage";
import { getPopularBlogPosts, getPublishedBlogPosts } from "@/lib/blog-helpers";

export const metadata: Metadata = {
    title: "Blog — Olongapo City Stories & Guides | GalaPo",
    description: "Read the latest stories, business guides, restaurant reviews, and tips about Olongapo City.",
};

interface PageProps {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BlogPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const page = Number(typeof params.page === "string" ? params.page : "1");
    const tag = typeof params.tag === "string" ? params.tag : null;

    const [postsResult, popularPosts] = await Promise.all([
        getPublishedBlogPosts({ page, limit: 10, tag }),
        getPopularBlogPosts(5),
    ]);

    return (
        <BlogIndexPage
            subtitle="Stories, guides, and tips about Olongapo City"
            posts={postsResult.data}
            featuredPost={tag ? null : postsResult.featured_post}
            tags={postsResult.tags}
            activeTag={tag}
            popularPosts={popularPosts}
            pagination={{ totalPages: postsResult.pagination.totalPages, page: postsResult.pagination.page }}
            basePath="/olongapo/blog"
        />
    );
}