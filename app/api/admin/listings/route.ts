import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { generateUniqueSlug } from "@/lib/listing-helpers";

export const dynamic = "force-dynamic";

function parseDateRange(from?: string | null, to?: string | null) {
    const start = from ? new Date(from) : null;
    const end = to ? new Date(to) : null;
    if (end) end.setHours(23, 59, 59, 999);
    return { start, end };
}

function parseBoolean(value: string | null) {
    if (value === "true") return true;
    if (value === "false") return false;
    return null;
}

type ListingRow = Record<string, any>;

function applyListingFilters(query: any, filters: {
    status: string;
    categoryId: string | null;
    subcategoryId: string | null;
    barangayId: string | null;
    plan: string;
    hasOwner: boolean | null;
    isActive: boolean | null;
    search: string;
    start: Date | null;
    end: Date | null;
}, includeArchived = false) {
    const { status, categoryId, subcategoryId, barangayId, plan, hasOwner, isActive, search, start, end } = filters;

    if (status && status !== "all") {
        query = query.eq("status", status);
    }
    // Note: the "all" view intentionally shows all statuses including deactivated.
    // Filter by status=deactivated to see only archived listings.
    if (categoryId) query = query.eq("category_id", categoryId);
    if (subcategoryId) query = query.eq("subcategory_id", subcategoryId);
    if (barangayId) query = query.eq("barangay_id", barangayId);
    if (isActive !== null) query = query.eq("is_active", isActive);
    if (hasOwner !== null) {
        if (hasOwner) query = query.not("owner_id", "is", null);
        else query = query.is("owner_id", null);
    }
    if (plan === "premium") query = query.eq("is_premium", true);
    if (plan === "featured") query = query.eq("is_featured", true).eq("is_premium", false);
    if (plan === "free") query = query.eq("is_featured", false).eq("is_premium", false);
    if (start) query = query.gte("created_at", start.toISOString());
    if (end) query = query.lte("created_at", end.toISOString());
    if (search) {
        query = query.or(`business_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    return query;
}

function enrichRows(rows: ListingRow[], viewsMap: Record<string, number>) {
    return rows.map((r) => ({
        ...r,
        category_name: r.categories?.name ?? "Uncategorized",
        subcategory_name: r.subcategory?.name ?? null,
        barangay_name: r.barangays?.name ?? "N/A",
        owner_name: r.profiles?.full_name ?? null,
        owner_email: r.profiles?.email ?? null,
        plan: r.is_premium ? "premium" : r.is_featured ? "featured" : "free",
        views_count: viewsMap[r.id] ?? 0,
        views_this_month: viewsMap[r.id] ?? 0,
        current_plan: r.is_premium ? "premium" : r.is_featured ? "featured" : "free",
    }));
}

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    const admin = createAdminSupabaseClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") ?? "all";
    const categorySlug = searchParams.get("category");
    const subcategorySlug = searchParams.get("subcategory");
    const barangaySlug = searchParams.get("barangay");
    const categoryIdParam = searchParams.get("category_id");
    const subcategoryIdParam = searchParams.get("subcategory_id");
    const barangayIdParam = searchParams.get("barangay_id");
    const plan = searchParams.get("plan") ?? "all";
    const hasOwnerRaw = searchParams.get("has_owner");
    const ownerType = searchParams.get("owner_type");
    const isActiveRaw = searchParams.get("is_active") ?? searchParams.get("active");
    const search = searchParams.get("search")?.trim() ?? "";
    const sortBy = searchParams.get("sort_by") ?? searchParams.get("sort") ?? "created_at";
    const sortOrder = (searchParams.get("sort_order") ?? searchParams.get("dir")) === "asc" ? "asc" : "desc";
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "20", 10), 1), 100);
    const offset = (page - 1) * limit;
    const { start, end } = parseDateRange(searchParams.get("date_from"), searchParams.get("date_to"));
    const safeSorts = new Set(["business_name", "status", "created_at", "category", "views"]);
    const safeSort = safeSorts.has(sortBy) ? sortBy : "created_at";

    try {
        const [categoryLookup, subcategoryLookup, barangayLookup] = await Promise.all([
            categorySlug && !categoryIdParam
                ? admin.from("categories").select("id").eq("slug", categorySlug).maybeSingle()
                : Promise.resolve({ data: null, error: null } as any),
            subcategorySlug && !subcategoryIdParam
                ? admin.from("categories").select("id").eq("slug", subcategorySlug).maybeSingle()
                : Promise.resolve({ data: null, error: null } as any),
            barangaySlug && !barangayIdParam
                ? admin.from("barangays").select("id").eq("slug", barangaySlug).maybeSingle()
                : Promise.resolve({ data: null, error: null } as any),
        ]);

        if (categoryLookup.error) throw categoryLookup.error;
        if (subcategoryLookup.error) throw subcategoryLookup.error;
        if (barangayLookup.error) throw barangayLookup.error;

        const categoryId = categoryIdParam ?? categoryLookup.data?.id ?? null;
        const subcategoryId = subcategoryIdParam ?? subcategoryLookup.data?.id ?? null;
        const barangayId = barangayIdParam ?? barangayLookup.data?.id ?? null;
        const hasOwner = hasOwnerRaw !== null
            ? parseBoolean(hasOwnerRaw)
            : ownerType === "has_owner"
                ? true
                : ownerType === "pre_populated"
                    ? false
                    : null;
        const isActive = parseBoolean(isActiveRaw);

        const baseSelect = `
            id, business_name, slug, status, created_at, is_active, is_featured, is_premium, is_pre_populated,
            owner_id, category_id, subcategory_id, barangay_id, phone, email,
            categories!listings_category_id_fkey(name, slug),
            subcategory:categories!listings_subcategory_id_fkey(name, slug),
            barangays!listings_barangay_id_fkey(name, slug),
            profiles!listings_owner_id_fkey(full_name, email)
        `;

        const filters = { status, categoryId, subcategoryId, barangayId, plan, hasOwner, isActive, search, start, end };

        let listingQuery = admin
            .from("listings")
            .select(baseSelect, { count: "exact" });
        listingQuery = applyListingFilters(listingQuery, filters);

        const needClientSort = safeSort === "views" || safeSort === "category";

        if (!needClientSort) {
            listingQuery = listingQuery
                .order(safeSort as any, { ascending: sortOrder === "asc" })
                .range(offset, offset + limit - 1);
        }

        const countsQuery = applyListingFilters(
            admin.from("listings").select("status, is_active"),
            { ...filters, status: "all" },
            true // Include archived in counts
        );

        const [rowsRes, countRowsRes] = await Promise.all([
            needClientSort ? listingQuery : listingQuery,
            countsQuery,
        ]);

        if (rowsRes.error) throw rowsRes.error;
        if (countRowsRes.error) throw countRowsRes.error;

        const rawRows = (rowsRes.data ?? []) as ListingRow[];
        const listingIds = rawRows.map((row) => row.id);
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

        const { data: monthViews, error: monthViewsError } = listingIds.length
            ? await admin
                .from("listing_analytics")
                .select("listing_id")
                .eq("event_type", "page_view")
                .in("listing_id", listingIds)
                .gte("created_at", monthStart)
            : { data: [], error: null };
        if (monthViewsError) throw monthViewsError;

        const viewsMap: Record<string, number> = {};
        (monthViews ?? []).forEach((r: any) => {
            viewsMap[r.listing_id] = (viewsMap[r.listing_id] ?? 0) + 1;
        });

        let rows = enrichRows(rawRows, viewsMap);

        if (needClientSort) {
            rows = rows.sort((a, b) => {
                if (safeSort === "views") {
                    const diff = (a.views_count ?? 0) - (b.views_count ?? 0);
                    return sortOrder === "asc" ? diff : -diff;
                }
                const aValue = String(a.category_name ?? "");
                const bValue = String(b.category_name ?? "");
                const cmp = aValue.localeCompare(bValue);
                return sortOrder === "asc" ? cmp : -cmp;
            });
            rows = rows.slice(offset, offset + limit);
        }

        const counts = {
            all: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            draft: 0,
            claimed_pending: 0,
            deactivated: 0,
            total: 0,
            active: 0,
            inactive: 0,
        };
        (countRowsRes.data ?? []).forEach((r: any) => {
            counts.total += 1;
            counts.all += 1;
            if (r.status in counts) (counts as any)[r.status] += 1;
            if (r.is_active) counts.active += 1;
            else counts.inactive += 1;
        });

        return NextResponse.json({
            data: rows,
            total: rowsRes.count ?? 0,
            page,
            limit,
            counts,
        });
    } catch (error: any) {
        console.error("[admin/listings GET]", error);
        return NextResponse.json({ error: error.message ?? "Failed to load listings" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const body = await request.json();
        const admin = createAdminSupabaseClient();
        const dynamicFields =
            body.dynamic_fields && typeof body.dynamic_fields === "object"
                ? body.dynamic_fields
                : {};
        const imageUrls = Array.isArray(body.image_urls)
            ? body.image_urls.filter((u: any) => typeof u === "string" && u.trim())
            : [];
        const ownerId = body.owner_id || null;
        const baseSlug = body.business_name || "listing";
        const { data: existingSlugs } = await admin
            .from("listings")
            .select("slug")
            .ilike("slug", `${String(baseSlug).toLowerCase().replace(/[^\w ]+/g, "").replace(/ +/g, "-")}%`);
        const slug = generateUniqueSlug(baseSlug, (existingSlugs ?? []).map((x: any) => x.slug));

        const payload: Record<string, any> = {
            owner_id: ownerId,
            city_id: body.city_id ?? "c0000000-0000-0000-0000-000000000001",
            barangay_id: body.barangay_id ?? null,
            category_id: body.category_id,
            subcategory_id: body.subcategory_id ?? null,
            business_name: body.business_name,
            slug,
            address: body.address,
            lat: body.lat ?? null,
            lng: body.lng ?? null,
            phone: body.phone ?? null,
            phone_secondary: body.phone_secondary ?? null,
            email: body.email ?? null,
            website: body.website ?? null,
            social_links: body.social_links ?? {},
            operating_hours: body.operating_hours ?? {},
            short_description: body.short_description ?? "",
            full_description: body.full_description ?? "",
            tags: body.tags ?? [],
            payment_methods: body.payment_methods ?? [],
            logo_url: body.logo_url ?? null,
            status: body.status ?? "approved",
            is_active: body.is_active ?? true,
            is_featured: body.is_featured ?? false,
            is_premium: body.is_premium ?? false,
            is_pre_populated: !ownerId,
        };

        const { data, error } = await admin.from("listings").insert(payload).select("*").single();
        if (error) throw error;

        const dynamicEntries = Object.entries(dynamicFields)
            .filter(([fieldId]) => !!fieldId)
            .map(([fieldId, value]) => ({ listing_id: data.id, field_id: fieldId, value }));
        if (dynamicEntries.length > 0) {
            const { error: dynamicError } = await admin.from("listing_field_values").insert(dynamicEntries);
            if (dynamicError) throw dynamicError;
        }

        if (imageUrls.length > 0) {
            const imageRows = imageUrls.map((image_url: string, idx: number) => ({
                listing_id: data.id,
                image_url,
                alt_text: body.business_name ?? null,
                sort_order: idx,
                is_primary: idx === 0,
            }));
            const { error: imageError } = await admin.from("listing_images").insert(imageRows);
            if (imageError) throw imageError;
        }

        return NextResponse.json({ data }, { status: 201 });
    } catch (error: any) {
        console.error("[admin/listings POST]", error);
        return NextResponse.json({ error: error.message ?? "Failed to create listing" }, { status: 500 });
    }
}
