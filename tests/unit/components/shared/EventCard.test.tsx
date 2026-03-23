import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EventCard from "@/components/shared/EventCard";

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

describe("EventCard", () => {
    const businessBadges = [
        {
            id: "lb-1",
            badge: {
                id: "badge-1",
                name: "Verified",
                slug: "verified",
            },
        },
    ];

    const baseProps = {
        slug: "city-fiesta",
        title: "City Fiesta",
        description: "Celebrate food, music, and local culture in one exciting day.",
        imageUrl: "https://example.com/event.jpg",
        eventDate: "2026-01-15",
        startTime: "19:00",
        endTime: "23:00",
        venue: "City Plaza",
        venueAddress: "Rizal Avenue, Olongapo City",
        listing: {
            businessName: "Cafe Uno",
            slug: "cafe-uno",
            badges: businessBadges as any,
            isFeatured: true,
            isPremium: false,
        },
    };

    it("renders event image", () => {
        render(<EventCard {...baseProps} />);

        expect(screen.getByTestId("lazy-image")).toHaveAttribute("src", "https://example.com/event.jpg");
    });

    it("renders placeholder when image is missing", () => {
        const { container } = render(<EventCard {...baseProps} imageUrl={null} />);

        expect(screen.queryByTestId("lazy-image")).not.toBeInTheDocument();
        expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("shows correct date badge month and day", () => {
        render(<EventCard {...baseProps} />);

        expect(screen.getByText("JAN")).toBeInTheDocument();
        expect(screen.getByText("15")).toBeInTheDocument();
    });

    it("renders clickable title to event detail page", () => {
        render(<EventCard {...baseProps} />);

        expect(screen.getByRole("link", { name: /city fiesta/i })).toHaveAttribute("href", "/olongapo/events/city-fiesta");
    });

    it("formats time and shows venue", () => {
        render(<EventCard {...baseProps} />);

        expect(screen.getByText("7:00 PM - 11:00 PM")).toBeInTheDocument();
        expect(screen.getByText(/City Plaza • Rizal Avenue, Olongapo City/i)).toBeInTheDocument();
    });

    it("shows business host and badges for business events", () => {
        render(<EventCard {...baseProps} />);

        expect(screen.getByText("Cafe Uno")).toBeInTheDocument();
        expect(screen.getByTestId("badge-display")).toHaveTextContent("Verified");
        expect(screen.getByText("Business Event")).toBeInTheDocument();
    });

    it("shows city-wide badge", () => {
        render(<EventCard {...baseProps} listing={null} isCityWide />);

        expect(screen.getByText("City-Wide Event")).toBeInTheDocument();
    });

    it("shows featured badge", () => {
        render(<EventCard {...baseProps} isFeatured />);

        expect(screen.getByText("Featured")).toBeInTheDocument();
    });

    it("shows past event styling and ended label", () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const eventDate = yesterday.toISOString().split("T")[0];

        render(<EventCard {...baseProps} eventDate={eventDate} isFeatured={false} />);

        expect(screen.getByText("Event ended")).toBeInTheDocument();
        expect(screen.getByText("This event has ended").closest("article")).toHaveClass("opacity-70");
    });

    it("truncates description to two lines", () => {
        render(<EventCard {...baseProps} />);

        expect(screen.getByText(/Celebrate food, music, and local culture/i)).toHaveClass("line-clamp-2");
    });
});