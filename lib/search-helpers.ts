// ──────────────────────────────────────────────────────────
// GalaPo — Search & Filter Helpers
// ──────────────────────────────────────────────────────────

const PH_TIMEZONE = "Asia/Manila";

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
type DayName = (typeof DAY_NAMES)[number];

export interface ParsedSearchParams {
    city: string;
    category: string | null;
    subcategory: string | null;
    barangay: string[];
    q: string | null;
    featuredOnly: boolean;
    openNow: boolean;
    sort: "featured" | "newest" | "name_asc" | "name_desc";
    page: number;
    limit: number;
}

/**
 * Parse and validate search params from a URL into a typed filter object.
 */
export function parseSearchParams(searchParams: URLSearchParams): ParsedSearchParams {
    const sortRaw = searchParams.get("sort");
    const validSorts = ["featured", "newest", "name_asc", "name_desc"] as const;
    const sort = validSorts.includes(sortRaw as any) ? (sortRaw as ParsedSearchParams["sort"]) : "featured";

    const limitRaw = parseInt(searchParams.get("limit") || "20", 10);
    const limit = Math.min(Math.max(1, limitRaw), 50);

    const pageRaw = parseInt(searchParams.get("page") || "1", 10);
    const page = Math.max(1, pageRaw);

    const barangayRaw = searchParams.get("barangay");
    const barangay = barangayRaw ? barangayRaw.split(",").map((b) => b.trim()).filter(Boolean) : [];

    return {
        city: searchParams.get("city") || "olongapo",
        category: searchParams.get("category") || null,
        subcategory: searchParams.get("subcategory") || null,
        barangay,
        q: searchParams.get("q") || null,
        featuredOnly: searchParams.get("featured_only") === "true",
        openNow: searchParams.get("open_now") === "true",
        sort,
        page,
        limit,
    };
}

/**
 * Build a URL with query params from a base URL and filter object.
 */
export function buildFilterUrl(baseUrl: string, filters: Partial<ParsedSearchParams>): string {
    const params = new URLSearchParams();

    if (filters.city && filters.city !== "olongapo") params.set("city", filters.city);
    if (filters.category) params.set("category", filters.category);
    if (filters.subcategory) params.set("subcategory", filters.subcategory);
    if (filters.barangay && filters.barangay.length > 0) params.set("barangay", filters.barangay.join(","));
    if (filters.q) params.set("q", filters.q);
    if (filters.featuredOnly) params.set("featured_only", "true");
    if (filters.openNow) params.set("open_now", "true");
    if (filters.sort && filters.sort !== "featured") params.set("sort", filters.sort);
    if (filters.page && filters.page > 1) params.set("page", String(filters.page));
    if (filters.limit && filters.limit !== 20) params.set("limit", String(filters.limit));

    const qs = params.toString();
    return qs ? `${baseUrl}?${qs}` : baseUrl;
}

/**
 * Get the current day name in Philippines timezone.
 */
export function getActiveDay(): DayName {
    const now = new Date();
    const phFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: PH_TIMEZONE,
        weekday: "long",
    });
    return phFormatter.format(now).toLowerCase() as DayName;
}

/**
 * Get the current time in Philippines timezone as "HH:MM".
 */
export function getPhTime(): string {
    const now = new Date();
    const phFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: PH_TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
    return phFormatter.format(now);
}

interface DayHours {
    is_closed?: boolean;
    open?: string;  // "08:00"
    close?: string; // "22:00"
}

/**
 * Check if a business is currently open based on its operating_hours JSON.
 * operating_hours shape: { monday: { is_closed: false, open: "08:00", close: "22:00" }, ... }
 */
export function isOpenNow(operatingHours: Record<string, DayHours> | null | undefined): boolean {
    if (!operatingHours) return false;

    const day = getActiveDay();
    const dayHours = operatingHours[day];

    if (!dayHours || dayHours.is_closed) return false;
    if (!dayHours.open || !dayHours.close) return false;

    const currentTime = getPhTime();
    return currentTime >= dayHours.open && currentTime <= dayHours.close;
}
