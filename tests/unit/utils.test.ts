import { describe, it, expect } from "vitest";
import {
    generateSlug,
    formatCurrency,
    formatDate,
    formatPhone,
    truncateText,
    generateInvoiceNumber
} from "@/lib/utils";

describe("Utils", () => {
    describe("generateSlug", () => {
        it("should convert text to lowercase", () => {
            expect(generateSlug("HELLO")).toBe("hello");
        });

        it("should replace spaces with hyphens", () => {
            expect(generateSlug("hello world")).toBe("hello-world");
        });

        it("should remove special characters", () => {
            expect(generateSlug("hello!@# world$%^")).toBe("hello-world");
        });

        it("should handle apostrophes by removing them", () => {
            expect(generateSlug("Juan's Eatery")).toBe("juans-eatery");
        });

        it("should convert '&' to 'and'", () => {
            expect(generateSlug("Guns & Roses")).toBe("guns-and-roses");
        });

        it("should handle Filipino special characters (ñ)", () => {
            expect(generateSlug("Pinya Niño")).toBe("pinya-nino");
        });

        it("should collapse multiple hyphens", () => {
            expect(generateSlug("hello   world")).toBe("hello-world");
        });

        it("should trim trailing hyphens", () => {
            expect(generateSlug("hello world - ")).toBe("hello-world");
        });
    });

    describe("formatCurrency", () => {
        it("should format positive numbers to Philippine Peso", () => {
            const formatted = formatCurrency(1500.5);
            expect(formatted).toContain("₱");
            expect(formatted).toContain(".50");
        });

        it("should handle zero properly", () => {
            const formatted = formatCurrency(0);
            expect(formatted).toContain("₱");
            expect(formatted).toContain("0.00");
        });

        it("should handle negative numbers", () => {
            const formatted = formatCurrency(-500);
            expect(formatted).toContain("-");
            expect(formatted).toContain("₱");
            expect(formatted).toContain("500.00");
        });
    });

    describe("formatDate", () => {
        it("should return a formatted string from ISO date", () => {
            const dateString = "2026-02-27T14:00:00Z";
            const formatted = formatDate(dateString);
            expect(formatted).not.toBe(dateString);
            expect(typeof formatted).toBe("string");
        });

        it("should handle Date objects directly by throwing or accepting if configured", () => {
            const d = new Date();
            // In our current implementation, formatDate takes a string. 
            // We pass it to any just to verify the fallback/error behavior doesn't crash
            const formatted = formatDate(d as any);
            expect(typeof formatted).toBe("string");
        });
    });

    describe("formatPhone", () => {
        it("should format 11-digit PH mobile numbers", () => {
            expect(formatPhone("09171234567")).toBe("+63 917 123 4567");
        });

        it("should format 12-digit PH mobile numbers starting with 63", () => {
            expect(formatPhone("639171234567")).toBe("+63 917 123 4567");
        });

        it("should strip non-digit characters", () => {
            expect(formatPhone("0917-123-4567")).toBe("+63 917 123 4567");
        });

        it("should return as-is if not matching standard format", () => {
            expect(formatPhone("12345")).toBe("12345");
        });
    });

    describe("generateInvoiceNumber", () => {
        it("should generate a string starting with GP-", () => {
            const invoice = generateInvoiceNumber();
            expect(invoice.startsWith("GP-")).toBe(true);
        });

        it("should generate unique invoices (most likely)", () => {
            const inv1 = generateInvoiceNumber();
            const inv2 = generateInvoiceNumber();
            expect(inv1).not.toBe(inv2);
        });
    });

    describe("truncateText", () => {
        it("should truncate text longer than the specified length", () => {
            expect(truncateText("Hello World", 5)).toBe("Hello…");
        });

        it("should not truncate text shorter than or equal to the length", () => {
            expect(truncateText("Hello", 5)).toBe("Hello");
            expect(truncateText("Hi", 5)).toBe("Hi");
        });
    });
});

