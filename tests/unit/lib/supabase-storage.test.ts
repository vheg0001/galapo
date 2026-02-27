import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockUpload, mockRemove, mockGetPublicUrl, mockStorageFrom } = vi.hoisted(() => {
    const upload = vi.fn().mockResolvedValue({ data: { path: "mock-folder/file.png" }, error: null });
    const remove = vi.fn().mockResolvedValue({ data: {}, error: null });
    const getPublicUrl = vi.fn().mockReturnValue({
        data: { publicUrl: "https://mock.supabase.co/storage/v1/object/public/mock-bucket/mock-folder/file.png" }
    });
    const from = vi.fn(() => ({
        upload,
        remove,
        getPublicUrl
    }));
    return {
        mockUpload: upload,
        mockRemove: remove,
        mockGetPublicUrl: getPublicUrl,
        mockStorageFrom: from
    };
});

vi.mock("@/lib/supabase", () => {
    return {
        createBrowserSupabaseClient: vi.fn(() => ({
            storage: {
                from: mockStorageFrom
            }
        }))
    };
});

import { createBrowserSupabaseClient } from "@/lib/supabase";
import {
    uploadFile,
    deleteFile,
    getPublicUrl,
    uploadLogo,
    uploadPaymentProof
} from "@/lib/supabase-storage";

describe("Supabase Storage Helpers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("uploadFile", () => {
        it("should upload a file and return the public URL", async () => {
            const mockFile = new File(["dummy content"], "test.png", { type: "image/png" });

            const result = await uploadFile("logos", "test/test.png", mockFile);

            expect(mockStorageFrom).toHaveBeenCalledWith("logos");
            expect(mockUpload).toHaveBeenCalledWith("test/test.png", mockFile, expect.any(Object));
            expect(mockGetPublicUrl).toHaveBeenCalledWith("test/test.png");

            expect(result).toEqual({
                path: "mock-folder/file.png",
                publicUrl: "https://mock.supabase.co/storage/v1/object/public/mock-bucket/mock-folder/file.png"
            });
        });

        it("should strip leading slashes from paths", async () => {
            const mockFile = new File(["dummy"], "test.png", { type: "image/png" });
            await uploadFile("logos", "/leading-slash/test.png", mockFile);

            expect(mockUpload).toHaveBeenCalledWith("leading-slash/test.png", mockFile, expect.any(Object));
        });
    });

    describe("deleteFile", () => {
        it("should call remove with the correct bucket and path array", async () => {
            await deleteFile("logos", "folder/file.png");

            expect(mockStorageFrom).toHaveBeenCalledWith("logos");
            expect(mockRemove).toHaveBeenCalledWith(["folder/file.png"]);
        });

        it("should strip leading slashes from paths", async () => {
            await deleteFile("logos", "/folder/file.png");
            expect(mockRemove).toHaveBeenCalledWith(["folder/file.png"]);
        });
    });

    describe("getPublicUrl", () => {
        it("should return the public URL directly", () => {
            const url = getPublicUrl("logos", "test.png");
            expect(mockStorageFrom).toHaveBeenCalledWith("logos");
            expect(mockGetPublicUrl).toHaveBeenCalledWith("test.png");
            expect(url).toBe("https://mock.supabase.co/storage/v1/object/public/mock-bucket/mock-folder/file.png");
        });
    });

    describe("Specialized Helpers", () => {
        // We mock Date.now to freeze time globally during this test block
        const fixedTime = 1600000000000;

        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(fixedTime);
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("uploadLogo delegates to uploadFile with correct bucket and generated path", async () => {
            const mockFile = new File(["dummy"], "my-logo.jpg", { type: "image/jpeg" });

            await uploadLogo(mockFile, "listing-123");

            expect(mockStorageFrom).toHaveBeenCalledWith("logos");
            // Generates: [listingId]/logo-[timestamp].[ext]
            expect(mockUpload).toHaveBeenCalledWith(`listing-123/logo-${fixedTime}.jpg`, mockFile, expect.any(Object));
        });

        it("uploadPaymentProof delegates to uploadFile with correct bucket and generated path", async () => {
            const mockFile = new File(["dummy"], "receipt.pdf", { type: "application/pdf" });

            await uploadPaymentProof(mockFile, "user-abc", "payment-456");

            expect(mockStorageFrom).toHaveBeenCalledWith("payments");
            // Generates: [userId]/[paymentId]-[timestamp].[ext]
            expect(mockUpload).toHaveBeenCalledWith(`user-abc/payment-456-${fixedTime}.pdf`, mockFile, expect.any(Object));
        });
    });
});
