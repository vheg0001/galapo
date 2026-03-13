import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase", () => ({
    createAdminSupabaseClient: vi.fn(),
}));

import {
    buildCanonicalBlogUrl,
    calculateReadTime,
    decorateArticleHtml,
    extractHeadings,
    extractUniqueTags,
    formatBlogPublishedDate,
    generateExcerpt,
    getRelatedPosts,
    stripHtml,
} from "@/lib/blog-helpers";

describe("blog-helpers", () => {
    const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

    beforeEach(() => {
        process.env.NEXT_PUBLIC_APP_URL = "https://galapo.test";
    });

    it("strips html, scripts, styles, and common entities", () => {
        const html = '<style>.x{}</style><script>alert(1)</script><p>Hello&nbsp;<strong>World</strong> &amp; friends</p>';
        expect(stripHtml(html)).toBe("Hello World & friends");
    });

    it("calculates read time with a minimum of one minute", () => {
        expect(calculateReadTime("<p>Short article</p>")).toBe(1);

        const twoHundredWords = Array.from({ length: 201 }, () => "word").join(" ");
        expect(calculateReadTime(`<p>${twoHundredWords}</p>`)).toBe(2);
    });

    it("extracts headings with stable deduplicated ids", () => {
        const headings = extractHeadings("<h2>Intro</h2><h3>Highlights</h3><h2>Intro</h2>");

        expect(headings).toEqual([
            { id: "intro", text: "Intro", level: 2 },
            { id: "highlights", text: "Highlights", level: 3 },
            { id: "intro-2", text: "Intro", level: 2 },
        ]);
    });

    it("generates excerpts, unique tags, and related posts", () => {
        const excerpt = generateExcerpt("<p>This is a long enough paragraph to become a short excerpt.</p>", 20);
        expect(excerpt.length).toBeLessThanOrEqual(20);

        expect(
            extractUniqueTags([
                { tags: ["Food", "Food", "Guides"] },
                { tags: ["Food", "Events"] },
            ])
        ).toEqual([
            { tag: "Food", count: 2 },
            { tag: "Events", count: 1 },
            { tag: "Guides", count: 1 },
        ]);

        const related = getRelatedPosts(
            { id: "current", tags: ["Food", "Travel"] },
            [
                {
                    id: "current",
                    title: "Current",
                    slug: "current",
                    content: "",
                    excerpt: null,
                    featured_image_url: null,
                    tags: ["Food"],
                    linked_listing_ids: [],
                    is_published: true,
                    author_id: "author-1",
                    published_at: "2026-03-01T00:00:00.000Z",
                    created_at: "2026-03-01T00:00:00.000Z",
                    updated_at: "2026-03-01T00:00:00.000Z",
                    author: { id: "author-1", name: "Author" },
                },
                {
                    id: "best-match",
                    title: "Best Match",
                    slug: "best-match",
                    content: "",
                    excerpt: null,
                    featured_image_url: null,
                    tags: ["Food", "Travel"],
                    linked_listing_ids: [],
                    is_published: true,
                    author_id: "author-1",
                    published_at: "2026-03-10T00:00:00.000Z",
                    created_at: "2026-03-10T00:00:00.000Z",
                    updated_at: "2026-03-10T00:00:00.000Z",
                    author: { id: "author-1", name: "Author" },
                },
                {
                    id: "second-match",
                    title: "Second Match",
                    slug: "second-match",
                    content: "",
                    excerpt: null,
                    featured_image_url: null,
                    tags: ["Food"],
                    linked_listing_ids: [],
                    is_published: true,
                    author_id: "author-1",
                    published_at: "2026-03-09T00:00:00.000Z",
                    created_at: "2026-03-09T00:00:00.000Z",
                    updated_at: "2026-03-09T00:00:00.000Z",
                    author: { id: "author-1", name: "Author" },
                },
            ] as any,
            3
        );

        expect(related.map((post) => post.id)).toEqual(["best-match", "second-match"]);
    });

    it("returns a safe fallback for missing or invalid blog dates", () => {
        expect(formatBlogPublishedDate()).toBe("Unpublished");
        expect(formatBlogPublishedDate("not-a-date")).toBe("Unpublished");
    });

    it("decorates article html with ids and presentation classes", () => {
        const html = [
            "<h2>Intro</h2>",
            '<p><a href="https://example.com">Visit</a></p>',
            "<blockquote>Quote</blockquote>",
            "<pre>const x = 1;</pre>",
            '<img src="/demo.jpg">',
            "<ul><li>One</li></ul>",
        ].join("");

        const decorated = decorateArticleHtml(html);

        expect(decorated).toContain('id="intro"');
        expect(decorated).toContain('target="_blank"');
        expect(decorated).toContain('rel="noopener noreferrer"');
        expect(decorated).toContain('border-l-4 border-primary/30');
        expect(decorated).toContain('overflow-x-auto rounded-xl bg-slate-950');
        expect(decorated).toContain('mx-auto my-6 h-auto max-w-full rounded-2xl');
        expect(decorated).toContain('list-disc pl-6');
    });

    it("builds canonical blog urls from the configured app url", () => {
        expect(buildCanonicalBlogUrl()).toBe("https://galapo.test/olongapo/blog");
        expect(buildCanonicalBlogUrl("seaside-escapes")).toBe("https://galapo.test/olongapo/blog/seaside-escapes");
    });

    afterAll(() => {
        process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    });
});