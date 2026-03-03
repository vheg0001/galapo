import { render, screen } from "@testing-library/react";
import ListingsTable from "@/components/business/dashboard/ListingsTable";
import { expect, test, describe } from "vitest";
import { DashboardListing } from "@/store/businessStore";

describe("ListingsTable", () => {
    const mockListings: DashboardListing[] = [
        {
            id: "1",
            business_name: "Coffee Shop",
            slug: "coffee-shop",
            status: "approved",
            is_featured: false,
            is_premium: true,
            views_this_month: 150,
            clicks_this_month: 20,
            category_name: "Food",
            subcategory_name: "Cafe",
            primary_image: null,
            current_plan: "premium"
        },
        {
            id: "2",
            business_name: "Tech Repair",
            slug: "tech-repair",
            status: "pending",
            is_featured: true,
            is_premium: false,
            views_this_month: 45,
            clicks_this_month: 5,
            category_name: "Services",
            subcategory_name: "Electronics",
            primary_image: null,
            current_plan: "featured"
        }
    ];

    test("renders listing rows with correct data", () => {
        render(<ListingsTable listings={mockListings} />);

        expect(screen.getByText("Coffee Shop")).toBeInTheDocument();
        expect(screen.getByText("Tech Repair")).toBeInTheDocument();
        expect(screen.getByText("150")).toBeInTheDocument();
        expect(screen.getByText("45")).toBeInTheDocument();
    });

    test("status badges show correct labels", () => {
        render(<ListingsTable listings={mockListings} />);

        expect(screen.getAllByText("Approved")[0]).toBeInTheDocument();
        expect(screen.getAllByText("Pending")[0]).toBeInTheDocument();
    });

    test("plan badges show correct labels", () => {
        render(<ListingsTable listings={mockListings} />);

        expect(screen.getAllByText("⭐ Premium")[0]).toBeInTheDocument();
        expect(screen.getAllByText("🔥 Featured")[0]).toBeInTheDocument();
    });

    test("renders links to edit page and public listing", () => {
        render(<ListingsTable listings={mockListings} />);

        const editLinks = screen.getAllByText("Edit");
        expect(editLinks[0].closest('a')).toHaveAttribute('href', '/business/listings/1/edit');

        const publicLink = screen.getByText("Coffee Shop");
        expect(publicLink).toHaveAttribute('href', '/listings/coffee-shop');
    });

    test("empty state shows CTA", () => {
        render(<ListingsTable listings={[]} />);

        expect(screen.getByText("No listings yet")).toBeInTheDocument();
        expect(screen.getByText("Add Your First Listing")).toBeInTheDocument();
        expect(screen.getByText("Add Your First Listing")).toHaveAttribute('href', '/business/listings/new');
    });

    test("renders loading state", () => {
        const { container } = render(<ListingsTable listings={[]} loading={true} />);
        const skeletons = container.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
    });
});
