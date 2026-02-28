import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "@/store/authStore";

// Mock the auth store
vi.mock("@/store/authStore", () => ({
    useAuthStore: vi.fn(),
}));

const mockResetPassword = vi.fn();

describe("ForgotPasswordForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuthStore as any).mockReturnValue({
            resetPassword: mockResetPassword,
        });
    });

    it("renders email and button", () => {
        render(<ForgotPasswordForm />);
        expect(screen.getByLabelText(/email address/i)).toBeDefined();
        expect(screen.getByRole("button", { name: /send reset link/i })).toBeDefined();
    });

    it("shows error for invalid email", async () => {
        render(<ForgotPasswordForm />);
        const emailInput = screen.getByLabelText(/email address/i);
        fireEvent.change(emailInput, { target: { value: "invalid-email" } });
        fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

        await waitFor(() => {
            expect(screen.getByText(/please enter a valid email address/i)).toBeDefined();
        });
    });

    it("submits successfully and shows success message", async () => {
        mockResetPassword.mockResolvedValue({ error: null });
        render(<ForgotPasswordForm />);

        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "test@example.com" } });
        fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));

        await waitFor(() => {
            expect(screen.getByText(/check your email/i)).toBeDefined();
            expect(screen.getByText(/we've sent a password reset link to/i)).toBeDefined();
        });
    });

    it("shows back to login link", () => {
        render(<ForgotPasswordForm />);
        const link = screen.getByRole("link", { name: /back to login/i });
        expect(link).toHaveAttribute("href", "/login");
    });
});
