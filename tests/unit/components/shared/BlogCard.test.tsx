import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BlogCard from "@/components/shared/BlogCard";

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

vi.mock("@/lib/blog-helpers", () => ({
    formatBlogPublishedDate: vi.fn(() => "Mar 13, 2026"),
}));

describe("BlogCard", () => {
    const baseProps = {
        slug: "city-guide",
        title: "City Guide",
        excerpt: "Discover the best local spots around Olongapo.",
        featuredImageUrl: "https://example.com/blog.jpg",
        publishedAt: "2026-03-10T00:00:00.000Z",
        authorName: "Jane Doe",
        authorAvatarUrl: "https://example.com/author.jpg",
        tags: ["Food", "Guides", "Weekend"],
        readTime: 5,
    };

    it("renders the main blog card content and links", () => {
        render(<BlogCard {...baseProps} />);

        expect(screen.getByTestId("lazy-image")).toHaveAttribute("src", baseProps.featuredImageUrl);
        expect(screen.getByText(baseProps.title)).toBeInTheDocument();
        expect(screen.getByText(baseProps.excerpt)).toBeInTheDocument();
        expect(screen.getByText(baseProps.authorName)).toBeInTheDocument();
        expect(screen.getByText("Mar 13, 2026")).toBeInTheDocument();
        expect(screen.getByText("5 min read")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /read more/i })).toHaveAttribute("href", "/olongapo/blog/city-guide");
    });

    it("shows only the first two tag chips", () => {
        render(<BlogCard {...baseProps} />);

        expect(screen.getByRole("link", { name: "Food" })).toHaveAttribute("href", "/olongapo/blog/tag/Food");
        expect(screen.getByRole("link", { name: "Guides" })).toHaveAttribute("href", "/olongapo/blog/tag/Guides");
        expect(screen.queryByText("Weekend")).not.toBeInTheDocument();
    });

    it("renders fallback artwork and default author text when media is missing", () => {
        render(
            <BlogCard
                slug="fallback-post"
                title="Fallback Post"
                publishedAt={null}
                authorName={null}
                authorAvatarUrl={null}
                featuredImageUrl={null}
                tags={[]}
                readTime={null}
            />
        );

        expect(screen.queryByTestId("lazy-image")).not.toBeInTheDocument();
        expect(screen.getByText("Olongapo Stories")).toBeInTheDocument();
        expect(screen.getByText("GalaPo Team")).toBeInTheDocument();
        expect(screen.queryByText(/min read/i)).not.toBeInTheDocument();
    });
});