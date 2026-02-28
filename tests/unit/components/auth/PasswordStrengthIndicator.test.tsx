import { render, screen } from "@testing-library/react";
import PasswordStrengthIndicator from "@/components/auth/PasswordStrengthIndicator";
import { describe, it, expect } from "vitest";

describe("PasswordStrengthIndicator", () => {
    it("is empty/hidden when password is empty", () => {
        const { container } = render(<PasswordStrengthIndicator password="" />);
        expect(container.firstChild).toBeNull();
    });

    it("shows weak strength for short password", () => {
        render(<PasswordStrengthIndicator password="abc" />);
        expect(screen.getByText(/weak password/i)).toBeDefined();
        const bars = screen.getAllByTestId("strength-bar");
        expect(bars[0]).toHaveClass("bg-red-500");
        expect(bars[1]).toHaveClass("bg-gray-200");
        expect(bars[2]).toHaveClass("bg-gray-200");
    });

    it("shows medium strength for medium password", () => {
        render(<PasswordStrengthIndicator password="abc12345" />);
        expect(screen.getByText(/medium password/i)).toBeDefined();
        const bars = screen.getAllByTestId("strength-bar");
        expect(bars[0]).toHaveClass("bg-yellow-500");
        expect(bars[1]).toHaveClass("bg-yellow-500");
        expect(bars[2]).toHaveClass("bg-gray-200");
    });

    it("shows strong strength for complex password", () => {
        render(<PasswordStrengthIndicator password="Abc12345!@" />);
        expect(screen.getByText(/strong password/i)).toBeDefined();
        const bars = screen.getAllByTestId("strength-bar");
        expect(bars[0]).toHaveClass("bg-green-500");
        expect(bars[1]).toHaveClass("bg-green-500");
        expect(bars[2]).toHaveClass("bg-green-500");
    });
});
