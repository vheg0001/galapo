import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "@/components/shared/Footer";
import {
    FOOTER_QUICK_LINKS,
    FOOTER_BUSINESS_LINKS,
    FOOTER_LEGAL_LINKS,
} from "@/lib/constants";

describe("Footer Component", () => {
    it("renders the brand details", () => {
        render(<Footer />);
        expect(screen.getByText("GalaPo")).toBeInTheDocument();
        expect(screen.getByText(/Discover Olongapo/)).toBeInTheDocument();
    });

    it("renders Quick Links column", () => {
        render(<Footer />);
        expect(screen.getByText("Quick Links")).toBeInTheDocument();
        FOOTER_QUICK_LINKS.forEach((link) => {
            const el = screen.getAllByText(link.label).find((el) => el.tagName === "A");
            expect(el).toHaveAttribute("href", link.href);
        });
    });

    it("renders For Business column", () => {
        render(<Footer />);
        expect(screen.getByText("For Business")).toBeInTheDocument();
        FOOTER_BUSINESS_LINKS.forEach((link) => {
            const el = screen.getAllByText(link.label).find((el) => el.tagName === "A");
            expect(el).toHaveAttribute("href", link.href);
        });
    });

    it("renders Legal column", () => {
        render(<Footer />);
        expect(screen.getByText("Legal")).toBeInTheDocument();
        FOOTER_LEGAL_LINKS.forEach((link) => {
            const el = screen.getAllByText(link.label).find((el) => el.tagName === "A");
            expect(el).toHaveAttribute("href", link.href);
        });
    });

    it("renders copyright with current year", () => {
        render(<Footer />);
        const year = new Date().getFullYear();
        expect(screen.getByText(new RegExp(`© ${year} GalaPo`))).toBeInTheDocument();
    });

    it("renders social media icons with correct links", () => {
        render(<Footer />);
        // Top section
        const fbLinks = screen.getAllByLabelText("Facebook");
        const igLinks = screen.getAllByLabelText("Instagram");

        expect(fbLinks.length).toBeGreaterThan(0);
        expect(igLinks.length).toBeGreaterThan(0);

        fbLinks.forEach(link => expect(link).toHaveAttribute("href", "https://facebook.com"));
        igLinks.forEach(link => expect(link).toHaveAttribute("href", "https://instagram.com"));
    });
});
