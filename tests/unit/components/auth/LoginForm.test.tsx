import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginForm from "@/components/auth/LoginForm";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "@/store/authStore";

// Mock the auth store
vi.mock("@/store/authStore", () => ({
    useAuthStore: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

const mockLogin = vi.fn();

describe("LoginForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuthStore as any).mockReturnValue({
            login: mockLogin,
        });
    });

    it("renders email and password fields", () => {
        render(<LoginForm />);
        expect(screen.getByLabelText(/email address/i)).toBeDefined();
        expect(screen.getByLabelText(/^password$/i)).toBeDefined();
        expect(screen.getByRole("button", { name: /^login$/i })).toBeDefined();
    });

    it("toggles password visibility", () => {
        render(<LoginForm />);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const toggleButton = screen.getByRole("button", { name: /show password/i });

        expect(passwordInput).toHaveAttribute("type", "password");
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute("type", "text");
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("submits with valid credentials", async () => {
        mockLogin.mockResolvedValue({ error: null });
        render(<LoginForm />);

        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "test@example.com" } });
        fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "password123" } });
        fireEvent.click(screen.getByRole("button", { name: /^login$/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
        });
    });

    it("shows forgot password and register links", () => {
        render(<LoginForm />);
        expect(screen.getByText(/forgot password\?/i)).toHaveAttribute("href", "/forgot-password");
        expect(screen.getByText(/register your business/i)).toHaveAttribute("href", "/register");
    });

    it("shows loading text during submission", async () => {
        // Mock login to return a promise that we control
        let resolveLogin: (value: any) => void = () => { };
        const loginPromise = new Promise((resolve) => {
            resolveLogin = resolve;
        });
        mockLogin.mockReturnValue(loginPromise);

        render(<LoginForm />);

        fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "test@example.com" } });
        fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "password123" } });
        fireEvent.click(screen.getByRole("button", { name: /^login$/i }));

        expect(screen.getByText(/logging in/i)).toBeDefined();

        // Cleanup
        resolveLogin({ error: null });
        await waitFor(() => { });
    });
});
