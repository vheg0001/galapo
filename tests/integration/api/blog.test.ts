// @ts-nocheck

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const getPublishedBlogPostsMock = vi.fn();
const getBlogPostDetailBySlugMock = vi.fn();
const getBlogTagsMock = vi.fn();
const listAdminBlogPostsMock = vi.fn();
const createAdminBlogPostMock = vi.fn();
const getAdminBlogPostByIdMock = vi.fn();
const updateAdminBlogPostMock = vi.fn();
const deleteAdminBlogPostMock = vi.fn();
const autosaveAdminBlogPostMock = vi.fn();
const uploadBlogImageFromFormDataMock = vi.fn();
const requireAdminMock = vi.fn();

const latestState = {
    response: { data: [], error: null as any },
};

function createLatestChain() {
    const chain: any = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        order: vi.fn(() => chain),
        limit: vi.fn(() => chain),
        then: (resolve: any, reject: any) => Promise.resolve(latestState.response).then(resolve, reject),
    };

    return chain;
}

const serverSupabase = {
    from: vi.fn(() => createLatestChain()),
};

vi.mock("@/lib/blog-helpers", () => ({
    getPublishedBlogPosts: ((...args: any[]) => (getPublishedBlogPostsMock as any)(...args)) as any,
    getBlogPostDetailBySlug: ((...args: any[]) => (getBlogPostDetailBySlugMock as any)(...args)) as any,
    getBlogTags: ((...args: any[]) => (getBlogTagsMock as any)(...args)) as any,
    listAdminBlogPosts: ((...args: any[]) => (listAdminBlogPostsMock as any)(...args)) as any,
    createAdminBlogPost: ((...args: any[]) => (createAdminBlogPostMock as any)(...args)) as any,
    getAdminBlogPostById: ((...args: any[]) => (getAdminBlogPostByIdMock as any)(...args)) as any,
    updateAdminBlogPost: ((...args: any[]) => (updateAdminBlogPostMock as any)(...args)) as any,
    deleteAdminBlogPost: ((...args: any[]) => (deleteAdminBlogPostMock as any)(...args)) as any,
    autosaveAdminBlogPost: ((...args: any[]) => (autosaveAdminBlogPostMock as any)(...args)) as any,
    uploadBlogImageFromFormData: ((...args: any[]) => (uploadBlogImageFromFormDataMock as any)(...args)) as any,
}));

vi.mock("@/lib/admin-helpers", () => ({
    requireAdmin: ((...args: any[]) => (requireAdminMock as any)(...args)) as any,
}));

vi.mock("@/lib/supabase", () => ({
    createServerSupabaseClient: vi.fn(async () => serverSupabase),
}));

vi.mock("@/lib/api-helpers", () => ({
    successResponse: (data: any) => NextResponse.json({ success: true, data }),
    errorResponse: (error: string, status = 500) => NextResponse.json({ success: false, error }, { status }),
}));

import { GET as getBlogPosts } from "@/app/api/blog/route";
import { GET as getBlogPost } from "@/app/api/blog/[slug]/route";
import { GET as getBlogTagsRoute } from "@/app/api/blog/tags/route";
import { GET as getLatestBlogPosts } from "@/app/api/blog/latest/route";
import { GET as getAdminBlogPosts, POST as createAdminBlogRoute } from "@/app/api/admin/blog/route";
import { GET as getAdminBlogPost, PUT as updateAdminBlogRoute, DELETE as deleteAdminBlogRoute } from "@/app/api/admin/blog/[id]/route";
import { PUT as autosaveAdminBlogRoute } from "@/app/api/admin/blog/[id]/autosave/route";
import { POST as uploadBlogImageRoute } from "@/app/api/admin/blog/upload-image/route";

describe("Blog API integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        latestState.response = { data: [], error: null };
        requireAdminMock.mockResolvedValue({ userId: "admin-1" });
    });

    it("GET /api/blog returns filtered published blog posts", async () => {
        getPublishedBlogPostsMock.mockResolvedValue({
            data: [{ id: "post-1", title: "City Guide" }],
            pagination: { total: 1, page: 2, limit: 5, totalPages: 1, hasNextPage: false, hasPrevPage: true },
            featured_post: null,
            tags: [{ tag: "Food", count: 1 }],
        });

        const response = await getBlogPosts(
            new NextRequest("http://localhost:3000/api/blog?tag=Food&search=market&featured=true&page=2&limit=5")
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(getPublishedBlogPostsMock).toHaveBeenCalledWith({
            tag: "Food",
            search: "market",
            featured: true,
            page: 2,
            limit: 5,
        });
        expect(body.data[0].title).toBe("City Guide");
    });

    it("GET /api/blog/[slug] returns detail data and increments the view count", async () => {
        getBlogPostDetailBySlugMock.mockResolvedValue({ id: "post-1", slug: "city-guide", title: "City Guide" });

        const response = await getBlogPost(new NextRequest("http://localhost:3000/api/blog/city-guide"), {
            params: Promise.resolve({ slug: "city-guide" }),
        });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(getBlogPostDetailBySlugMock).toHaveBeenCalledWith("city-guide", { incrementView: true });
        expect(body.data.title).toBe("City Guide");
    });

    it("GET /api/blog/[slug] returns 404 when the post is missing", async () => {
        getBlogPostDetailBySlugMock.mockResolvedValue(null);

        const response = await getBlogPost(new NextRequest("http://localhost:3000/api/blog/missing-post"), {
            params: Promise.resolve({ slug: "missing-post" }),
        });

        expect(response.status).toBe(404);
    });

    it("GET /api/blog/tags returns blog tags", async () => {
        getBlogTagsMock.mockResolvedValue([{ tag: "Food", count: 3 }]);

        const response = await getBlogTagsRoute();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data).toEqual([{ tag: "Food", count: 3 }]);
    });

    it("GET /api/blog/latest returns the latest published posts with the requested limit", async () => {
        latestState.response = {
            data: [{ id: "post-1", title: "Fresh Picks" }],
            error: null,
        };

        const response = await getLatestBlogPosts(new NextRequest("http://localhost:3000/api/blog/latest?limit=4"));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(serverSupabase.from).toHaveBeenCalledWith("blog_posts");
        expect(body.success).toBe(true);
        expect(body.data[0].title).toBe("Fresh Picks");
    });

    it("admin blog routes require admin access", async () => {
        requireAdminMock.mockResolvedValueOnce({
            error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
        });

        const response = await getAdminBlogPosts(new NextRequest("http://localhost:3000/api/admin/blog"));

        expect(response.status).toBe(403);
    });

    it("GET and POST /api/admin/blog delegate to admin blog helpers", async () => {
        listAdminBlogPostsMock.mockResolvedValue({
            data: [{ id: "post-1", title: "Draft Story" }],
            pagination: { total: 1, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false },
        });
        createAdminBlogPostMock.mockResolvedValue({ id: "post-2", title: "New Story" });

        const getResponse = await getAdminBlogPosts(new NextRequest("http://localhost:3000/api/admin/blog?status=draft&page=1&limit=10"));
        const getBody = await getResponse.json();
        expect(getResponse.status).toBe(200);
        expect(listAdminBlogPostsMock).toHaveBeenCalledWith({ status: "draft", search: null, page: 1, limit: 10 });
        expect(getBody.data[0].title).toBe("Draft Story");

        const postResponse = await createAdminBlogRoute(
            new NextRequest("http://localhost:3000/api/admin/blog", {
                method: "POST",
                body: JSON.stringify({ title: "New Story", content: "<p>Hello</p>" }),
            })
        );
        const postBody = await postResponse.json();

        expect(postResponse.status).toBe(201);
        expect(createAdminBlogPostMock).toHaveBeenCalledWith("admin-1", { title: "New Story", content: "<p>Hello</p>" });
        expect(postBody.data.id).toBe("post-2");
    });

    it("admin detail, update, delete, autosave, and upload routes work", async () => {
        getAdminBlogPostByIdMock.mockResolvedValue({ id: "post-1", title: "Draft Story" });
        updateAdminBlogPostMock.mockResolvedValue({ id: "post-1", title: "Updated Story" });
        deleteAdminBlogPostMock.mockResolvedValue(true);
        autosaveAdminBlogPostMock.mockResolvedValue({ saved_at: "2026-03-13T12:00:00.000Z" });
        uploadBlogImageFromFormDataMock.mockResolvedValue({ url: "https://example.com/blog/cover.png" });

        const getResponse = await getAdminBlogPost(new NextRequest("http://localhost:3000/api/admin/blog/post-1"), {
            params: Promise.resolve({ id: "post-1" }),
        });
        expect(getResponse.status).toBe(200);

        const updateResponse = await updateAdminBlogRoute(
            new NextRequest("http://localhost:3000/api/admin/blog/post-1", {
                method: "PUT",
                body: JSON.stringify({ title: "Updated Story" }),
            }),
            { params: Promise.resolve({ id: "post-1" }) }
        );
        const updateBody = await updateResponse.json();
        expect(updateResponse.status).toBe(200);
        expect(updateAdminBlogPostMock).toHaveBeenCalledWith("post-1", { title: "Updated Story" });
        expect(updateBody.data.title).toBe("Updated Story");

        const deleteResponse = await deleteAdminBlogRoute(new NextRequest("http://localhost:3000/api/admin/blog/post-1", { method: "DELETE" }), {
            params: Promise.resolve({ id: "post-1" }),
        });
        const deleteBody = await deleteResponse.json();
        expect(deleteResponse.status).toBe(200);
        expect(deleteAdminBlogPostMock).toHaveBeenCalledWith("post-1");
        expect(deleteBody.success).toBe(true);

        const autosaveResponse = await autosaveAdminBlogRoute(
            new NextRequest("http://localhost:3000/api/admin/blog/post-1/autosave", {
                method: "PUT",
                body: JSON.stringify({ title: "Autosaved Title" }),
            }),
            { params: Promise.resolve({ id: "post-1" }) }
        );
        const autosaveBody = await autosaveResponse.json();
        expect(autosaveResponse.status).toBe(200);
        expect(autosaveAdminBlogPostMock).toHaveBeenCalledWith("post-1", { title: "Autosaved Title" });
        expect(autosaveBody.saved_at).toBe("2026-03-13T12:00:00.000Z");

        const formData = new FormData();
        formData.set("file", new File(["image"], "cover.png", { type: "image/png" }));
        const uploadRequest = {
            formData: vi.fn().mockResolvedValue(formData),
        } as any;

        const uploadResponse = await uploadBlogImageRoute(uploadRequest);
        const uploadBody = await uploadResponse.json();
        expect(uploadResponse.status).toBe(200);
        expect(uploadBlogImageFromFormDataMock).toHaveBeenCalledWith(formData);
        expect(uploadBody.url).toBe("https://example.com/blog/cover.png");
    });

    it("GET /api/admin/blog/[id] returns 404 for unknown posts", async () => {
        getAdminBlogPostByIdMock.mockResolvedValue(null);

        const response = await getAdminBlogPost(new NextRequest("http://localhost:3000/api/admin/blog/missing"), {
            params: Promise.resolve({ id: "missing" }),
        });

        expect(response.status).toBe(404);
    });
});