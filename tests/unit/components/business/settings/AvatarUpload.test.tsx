import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AvatarUpload from "@/components/business/settings/AvatarUpload";
import { expect, test, describe, vi, beforeEach } from "vitest";
import { useAuthStore } from "@/store/authStore";

// Mock the auth store
vi.mock("@/store/authStore", () => ({
    useAuthStore: vi.fn(),
}));

// Mock Supabase with storage
const mockUpload = vi.fn().mockResolvedValue({ data: {}, error: null });
const mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: "https://example.com/avatar.jpg" } });

vi.mock("@/lib/supabase", () => ({
    createBrowserSupabaseClient: vi.fn(() => ({
        storage: {
            from: vi.fn(() => ({
                upload: mockUpload,
                getPublicUrl: mockGetPublicUrl,
            })),
        },
        from: vi.fn(() => ({
            update: vi.fn(() => ({
                eq: vi.fn(() => ({
                    select: vi.fn(() => ({
                        single: vi.fn(() => Promise.resolve({ data: { avatar_url: "https://example.com/avatar.jpg" }, error: null })),
                    })),
                })),
            })),
        })),
    })),
}));

describe("AvatarUpload", () => {
    const mockProfile = {
        id: "1",
        full_name: "John Doe",
        avatar_url: null,
    };
    const mockSetProfile = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuthStore as any).mockReturnValue({
            profile: mockProfile,
            setProfile: mockSetProfile,
        });
    });

    test("renders placeholder with initial if no avatar", () => {
        render(<AvatarUpload />);
        expect(screen.getByText("J")).toBeInTheDocument();
    });

    test("renders avatar image if URL is present", () => {
        (useAuthStore as any).mockReturnValue({
            profile: { ...mockProfile, avatar_url: "https://example.com/existing.jpg" },
            setProfile: mockSetProfile,
        });
        render(<AvatarUpload />);
        const img = screen.getByAltText("Profile photo");
        expect(img).toBeInTheDocument();
    });

    test("triggers file input on click", () => {
        render(<AvatarUpload />);
        const button = screen.getByRole("button", { name: /Change Photo/i });
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;

        // Mock click event
        const clickSpy = vi.spyOn(input, 'click');
        fireEvent.click(button);
        expect(clickSpy).toHaveBeenCalled();
    });

    test("validates file type (images only)", async () => {
        render(<AvatarUpload />);
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;

        const file = new File(["foo"], "foo.txt", { type: "text/plain" });
        fireEvent.change(input, { target: { files: [file] } });

        expect(screen.getByText(/Please select an image file/i)).toBeInTheDocument();
    });

    test("validates file size (max 5MB)", async () => {
        render(<AvatarUpload />);
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;

        // Create a large shimmed file
        const largeFile = new File(["a".repeat(6 * 1024 * 1024)], "large.jpg", { type: "image/jpeg" });
        fireEvent.change(input, { target: { files: [largeFile] } });

        expect(screen.getByText(/Image must be smaller than 5 MB/i)).toBeInTheDocument();
    });

    test("uploads and updates profile on valid file selection", async () => {
        render(<AvatarUpload />);
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;

        const file = new File(["(⌐□_□)"], "avatar.png", { type: "image/png" });
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(mockUpload).toHaveBeenCalled();
            expect(mockSetProfile).toHaveBeenCalledWith({ avatar_url: expect.stringContaining("avatar.jpg") });
        });
    });
});
