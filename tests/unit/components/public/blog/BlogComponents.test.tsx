import type { AnchorHTMLAttributes, ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FeaturedPost from "@/components/public/blog/FeaturedPost";
import TagCloud from "@/components/public/blog/TagCloud";
import RelatedPosts from "@/components/public/blog/RelatedPosts";
import AuthorBio from "@/components/public/blog/AuthorBio";
import LinkedListingCard from "@/components/public/blog/LinkedListingCard";
import LinkedListingsSection from "@/components/public/blog/LinkedListingsSection";
import ArticleContent from "@/components/public/blog/ArticleContent";
import TableOfContents from "@/components/public/blog/TableOfContents";

type MockLinkProps = {
    href: string;
    children: ReactNode;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

vi.mock("next/link", () => ({
    default: ({ href, children, ...rest }: MockLinkProps) => <a href={href} {...rest}>{children}</a>,
}));

vi.mock("@/components/shared/LazyImage", () => ({
    default: ({ src, alt }: { src: string; alt: string }) => <img data-testid="lazy-image" src={src} alt={alt} />,
}));

vi.mock("@/components/shared/BadgeDisplay", () => ({
    default: ({ badges }: any) => (
        <div data-testid="badge-display">{(badges || []).map((badge: any) => badge.badge?.name).join(", ")}</div>
    ),
}));

vi.mock("@/components/shared/BlogCard", () => ({
    default: ({ title }: { title: string }) => <div data-testid="related-blog-card">{title}</div>,
}));

vi.mock("@/lib/blog-helpers", async () => {
    const actual = await vi.importActual<any>("@/lib/blog-helpers");
    return {
        ...actual,
        formatBlogPublishedDate: vi.fn(() => "2 days ago"),
        decorateArticleHtml: vi.fn((html: string) => `<h2 id="intro" class="group scroll-mt-24 font-bold tracking-tight"><a href="#intro" class="no-underline hover:underline">Intro</a></h2>${html}`),
    };
});

describe("Blog public components", () => {
    const author = {
        id: "author-1",
        name: "Jane Doe",
        avatar_url: "https://example.com/jane.jpg",
        bio: "Local storyteller and food guide.",
    };

    const post = {
        id: "post-1",
        title: "Seaside Escapes",
        slug: "seaside-escapes",
        content: "<p>Content</p>",
        excerpt: "A tour of the city's most scenic corners.",
        featured_image_url: "https://example.com/cover.jpg",
        tags: ["Travel", "Food"],
        linked_listing_ids: [],
        is_published: true,
        author_id: author.id,
        published_at: "2026-03-11T00:00:00.000Z",
        created_at: "2026-03-10T00:00:00.000Z",
        updated_at: "2026-03-10T00:00:00.000Z",
        read_time: 6,
        view_count: 42,
        author,
    };

    const listing = {
        id: "listing-1",
        slug: "seaside-cafe",
        business_name: "Seaside Cafe",
        short_description: "Fresh seafood and sunset views.",
        logo_url: "https://example.com/logo.jpg",
        image_url: null,
        is_featured: true,
        is_premium: true,
        category: { id: "cat-1", name: "Restaurants", slug: "restaurants" },
        barangay: { id: "brgy-1", name: "Barretto", slug: "barretto" },
        badges: [
            {
                id: "lb-1",
                badge: {
                    id: "badge-1",
                    name: "Verified",
                    slug: "verified",
                },
            },
        ],
    };

    it("renders the featured post hero and returns null when no post is provided", () => {
        const { container, rerender } = render(<FeaturedPost post={post as any} />);

        expect(screen.getByText("Featured Post")).toBeInTheDocument();
        expect(screen.getByText(post.title)).toBeInTheDocument();
        expect(screen.getByText(author.name)).toBeInTheDocument();
        expect(screen.getByText("2 days ago")).toBeInTheDocument();
        expect(screen.getByText("6 min read")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /read more/i })).toHaveAttribute("href", "/olongapo/blog/seaside-escapes");

        rerender(<FeaturedPost post={null} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("renders tag links and preserves existing query params in the base path", () => {
        render(
            <TagCloud
                tags={[
                    { tag: "Food Guide", count: 3 },
                    { tag: "Events", count: 1 },
                ]}
                activeTag="Food Guide"
                basePath="/olongapo/blog?page=2"
                showAllChip
            />
        );

        expect(screen.getByRole("link", { name: "All" })).toHaveAttribute("href", "/olongapo/blog?page=2");
        expect(screen.getByRole("link", { name: /Food Guide/i })).toHaveAttribute("href", "/olongapo/blog?page=2&tag=Food%20Guide");
        expect(screen.getByRole("link", { name: /Events/i })).toHaveAttribute("href", "/olongapo/blog?page=2&tag=Events");
    });

    it("converts tag route pages into clean tag and all-post links", () => {
        render(
            <TagCloud
                tags={[
                    { tag: "Food Guide", count: 3 },
                    { tag: "Events", count: 1 },
                ]}
                activeTag="Food Guide"
                basePath="/olongapo/blog/tag/Food%20Guide?page=2"
                showAllChip
            />
        );

        expect(screen.getByRole("link", { name: "All" })).toHaveAttribute("href", "/olongapo/blog");
        expect(screen.getByRole("link", { name: /Food Guide/i })).toHaveAttribute("href", "/olongapo/blog/tag/Food%20Guide?page=2");
        expect(screen.getByRole("link", { name: /Events/i })).toHaveAttribute("href", "/olongapo/blog/tag/Events?page=2");
    });

    it("renders related posts and hides the section when no posts exist", () => {
        const { container, rerender } = render(<RelatedPosts posts={[post as any, { ...post, id: "post-2", title: "Night Market Finds" } as any]} />);

        expect(screen.getByText("You Might Also Like")).toBeInTheDocument();
        expect(screen.getAllByTestId("related-blog-card")).toHaveLength(2);

        rerender(<RelatedPosts posts={[]} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("renders the author bio block and search link", () => {
        render(<AuthorBio author={{ ...author, avatar_url: null } as any} />);

        expect(screen.getByText(author.name)).toBeInTheDocument();
        expect(screen.getByText(author.bio)).toBeInTheDocument();
        expect(screen.getByRole("link", { name: new RegExp(`View all posts by ${author.name}`) })).toHaveAttribute(
            "href",
            "/olongapo/blog?search=Jane%20Doe"
        );
    });

    it("renders linked listing details, badges, and compact description styling", () => {
        render(<LinkedListingCard listing={listing as any} compact />);

        expect(screen.getByText("Mentioned in this article")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: listing.business_name })).toHaveAttribute("href", "/listing/seaside-cafe");
        expect(screen.getByText("Must Visit")).toBeInTheDocument();
        expect(screen.getByText("Restaurants · Barretto")).toBeInTheDocument();
        expect(screen.getByTestId("badge-display")).toHaveTextContent("Verified");
        expect(screen.getByText(/Fresh seafood and sunset views/i)).toHaveClass("line-clamp-2");
    });

    it("renders the linked listings section only when listings are provided", () => {
        const secondaryListing = { ...listing, id: "listing-2", slug: "harbor-grill", business_name: "Harbor Grill" };
        const { container, rerender } = render(<LinkedListingsSection listings={[listing as any, secondaryListing as any]} />);

        expect(screen.getByText("Businesses Mentioned in This Article")).toBeInTheDocument();
        expect(screen.getByText("Seaside Cafe")).toBeInTheDocument();
        expect(screen.getByText("Harbor Grill")).toBeInTheDocument();

        rerender(<LinkedListingsSection listings={[]} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("renders decorated article html and inline linked listings", () => {
        const secondaryListing = { ...listing, id: "listing-2", slug: "harbor-grill", business_name: "Harbor Grill" };
        const { container } = render(
            <ArticleContent
                htmlContent="<p>First paragraph.</p>"
                linkedListings={[listing as any, secondaryListing as any]}
            />
        );

        expect(screen.getByText("Intro")).toBeInTheDocument();
        expect(screen.getByText("First paragraph.")).toBeInTheDocument();
        expect(screen.getByText("Seaside Cafe")).toBeInTheDocument();
        expect(screen.getByText("Harbor Grill")).toBeInTheDocument();
        expect(container.querySelector("article")?.innerHTML).toContain('id="intro"');
    });

    it("tracks and scrolls to headings from the table of contents", async () => {
        const intro = document.createElement("section");
        intro.id = "intro";
        Object.defineProperty(intro, "scrollIntoView", { value: vi.fn(), writable: true });
        Object.defineProperty(intro, "getBoundingClientRect", {
            value: vi.fn(() => ({ top: 100, bottom: 260, left: 0, right: 0, width: 0, height: 160, x: 0, y: 100, toJSON: () => ({}) })),
            writable: true,
        });

        const details = document.createElement("section");
        details.id = "details";
        Object.defineProperty(details, "scrollIntoView", { value: vi.fn(), writable: true });
        Object.defineProperty(details, "getBoundingClientRect", {
            value: vi.fn(() => ({ top: 400, bottom: 560, left: 0, right: 0, width: 0, height: 160, x: 0, y: 400, toJSON: () => ({}) })),
            writable: true,
        });

        document.body.appendChild(intro);
        document.body.appendChild(details);

        render(
            <TableOfContents
                headings={[
                    { id: "intro", text: "Intro", level: 2 },
                    { id: "details", text: "Details", level: 3 },
                ]}
            />
        );

        await waitFor(() => expect(screen.getByRole("button", { name: "Intro" }).className).toContain("font-semibold"));

        fireEvent.click(screen.getByRole("button", { name: "Details" }));
        expect((details as any).scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });

        intro.remove();
        details.remove();
    });
});