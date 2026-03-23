import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";
import { APP_URL } from "@/lib/constants";

// Integration tests for Auth API endpoints
describe("Auth API Integration", () => {
    it("POST /api/auth/register with valid data returns 201", async () => {
        const response = await fetch(`${APP_URL}/api/auth/register`, {
            method: "POST",
            body: JSON.stringify({
                email: "new@example.com",
                password: "StrongPass123!",
                full_name: "New User",
                phone: "09171234567",
            }),
        });

        const data = await response.json();
        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.user.email).toBe("new@example.com");
    });

    it("POST /api/auth/register with duplicate email returns 409", async () => {
        const response = await fetch(`${APP_URL}/api/auth/register`, {
            method: "POST",
            body: JSON.stringify({
                email: "duplicate@example.com",
                password: "StrongPass123!",
                full_name: "Duplicate User",
                phone: "09171234567",
            }),
        });

        const data = await response.json();
        expect(response.status).toBe(409);
        expect(data.error).toContain("already exists");
    });

    it("POST /api/auth/login with valid credentials returns 200", async () => {
        const response = await fetch(`${APP_URL}/api/auth/login`, {
            method: "POST",
            body: JSON.stringify({
                email: "user@example.com",
                password: "correct",
            }),
        });

        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.profile.role).toBe("business_owner");
    });

    it("POST /api/auth/login with wrong password returns 401", async () => {
        const response = await fetch(`${APP_URL}/api/auth/login`, {
            method: "POST",
            body: JSON.stringify({
                email: "user@example.com",
                password: "wrong",
            }),
        });

        const data = await response.json();
        expect(response.status).toBe(401);
        expect(data.error).toContain("credentials");
    });

    it("POST /api/auth/logout returns 200", async () => {
        const response = await fetch(`${APP_URL}/api/auth/logout`, {
            method: "POST",
        });

        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
    });

    it("GET /api/auth/session returns session data", async () => {
        const response = await fetch(`${APP_URL}/api/auth/session`);
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.user).toBeDefined();
        expect(data.profile.role).toBe("business_owner");
    });

    it("GET /api/notifications returns user's notifications", async () => {
        const response = await fetch(`${APP_URL}/api/notifications`);
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.data).toHaveLength(5);
        expect(data.meta.unread_count).toBe(3);
    });

    it("PATCH /api/notifications/[id]/read returns 200", async () => {
        const response = await fetch(`${APP_URL}/api/notifications/msg-123/read`, {
            method: "PATCH",
        });
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
    });
});
