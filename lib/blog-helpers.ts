import { differenceInCalendarDays, formatDistanceToNow } from "date-fns";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { formatDate, generateSlug, truncateText } from "@/lib/utils";
import type {
    BlogAuthor,
    BlogHeading,
    BlogLinkedListing,
    BlogNavigationPost,
    BlogPost,
    BlogPostCard,
    BlogPostDetail,
    ListingBadge,
    TagCount,
} from "@/lib/types";

type BlogRow = BlogPost & {
    is_featured?: boolean | null;
    view_count?: number | null;
    read_time?: number | null;
};

type BlogListingCategory = NonNullable<BlogLinkedListing["category"]>;
type BlogListingBarangay = NonNullable<BlogLinkedListing["barangay"]>;

interface PublishedBlogQuery {
    tag?: string | null;
    search?: string | null;
    featured?: boolean;
    page?: number;
    limit?: number;
}

interface AdminBlogQuery {
    status?: "all" | "published" | "draft";
    search?: string | null;
    page?: number;
    limit?: number;
}

interface SaveBlogPostInput {
    title: string;
    slug?: string | null;
    content: string;
    excerpt?: string | null;
    featured_image_url?: string | null;
    tags?: string[];
    linked_listing_ids?: string[];
    is_published?: boolean;
    is_featured?: boolean;
    meta_title?: string | null;
    meta_description?: string | null;
    published_at?: string | null;
    author_name?: string | null;
}

const DEFAULT_AUTHOR_BIO = "Contributor to the GalaPo Blog, sharing local stories, guides, and business highlights around Olongapo City.";

function getNowIso() {
    return new Date().toISOString();
}

export function stripHtml(htmlContent: string = "") {
    return htmlContent
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, " ")
        .trim();
}

export function calculateReadTime(htmlContent: string) {
    const words = stripHtml(htmlContent).split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
}

export function slugifyHeadingId(text: string) {
    return generateSlug(text || "section");
}

function buildHeadingList(htmlContent: string) {
    const headings: BlogHeading[] = [];
    const slugCounts = new Map<string, number>();

    htmlContent.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (_match, rawLevel, _attrs, innerHtml) => {
        const level = Number(rawLevel) as 2 | 3;
        const text = stripHtml(innerHtml);
        if (!text) return "";

        const baseId = slugifyHeadingId(text);
        const currentCount = (slugCounts.get(baseId) ?? 0) + 1;
        slugCounts.set(baseId, currentCount);

        headings.push({
            level,
            text,
            id: currentCount === 1 ? baseId : `${baseId}-${currentCount}`,
        });

        return "";
    });

    return headings;
}

export function extractHeadings(htmlContent: string) {
    return buildHeadingList(htmlContent);
}

export function generateExcerpt(htmlContent: string, maxLength = 300) {
    const stripped = stripHtml(htmlContent);
    if (!stripped) return "";
    return stripped.length <= maxLength ? stripped : `${truncateText(stripped, maxLength - 1)}`;
}

export function extractUniqueTags(posts: Array<{ tags?: string[] | null }>) {
    const tagMap = new Map<string, number>();

    posts.forEach((post) => {
        const uniqueTags = new Set((post.tags ?? []).map((tag) => tag.trim()).filter(Boolean));
        uniqueTags.forEach((tag) => tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1));
    });

    return Array.from(tagMap.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => (b.count - a.count) || a.tag.localeCompare(b.tag));
}

export function getRelatedPosts(currentPost: { id: string; tags?: string[] | null }, allPosts: BlogPostCard[], limit = 3) {
    const currentTags = new Set((currentPost.tags ?? []).map((tag) => tag.toLowerCase()));

    return allPosts
        .filter((post) => post.id !== currentPost.id)
        .map((post) => {
            const sharedTags = (post.tags ?? []).filter((tag) => currentTags.has(tag.toLowerCase())).length;
            return { post, score: sharedTags };
        })
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score || new Date(b.post.published_at ?? b.post.created_at).getTime() - new Date(a.post.published_at ?? a.post.created_at).getTime())
        .slice(0, limit)
        .map((entry) => entry.post);
}

export function formatBlogPublishedDate(date?: string | null) {
    if (!date) return "Unpublished";
    const published = new Date(date);
    if (Number.isNaN(published.getTime())) return "Unpublished";
    const dayDiff = Math.abs(differenceInCalendarDays(new Date(), published));
    if (dayDiff <= 7) {
        return formatDistanceToNow(published, { addSuffix: true });
    }
    return formatDate(date);
}

function ensureLivePostFilter(query: any) {
    return query
        .eq("is_published", true)
        .or(`published_at.is.null,published_at.lte.${getNowIso()}`);
}

function normalizeTags(tags?: string[] | null) {
    return Array.from(new Set((tags ?? []).map((tag) => tag.trim()).filter(Boolean))).slice(0, 10);
}

function buildAuthorMap(profiles: Array<{ id: string; full_name?: string | null; avatar_url?: string | null }>) {
    return new Map<string, BlogAuthor>(
        profiles.map((profile) => [
            profile.id,
            {
                id: profile.id,
                name: profile.full_name || "GalaPo Team",
                avatar_url: profile.avatar_url ?? null,
                bio: DEFAULT_AUTHOR_BIO,
            },
        ])
    );
}

async function fetchAuthors(authorIds: string[]) {
    const uniqueIds = Array.from(new Set(authorIds.filter(Boolean)));
    if (uniqueIds.length === 0) return new Map<string, BlogAuthor>();

    const admin = createAdminSupabaseClient();
    const { data } = await admin
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", uniqueIds);

    return buildAuthorMap(data ?? []);
}

async function fetchListingBadges(listingIds: string[]) {
    if (listingIds.length === 0) return new Map<string, ListingBadge[]>();

    const admin = createAdminSupabaseClient();
    const { data } = await admin
        .from("listing_badges")
        .select("id, listing_id, is_active, expires_at, badges(id, name, slug, icon, icon_lucide, color, text_color, type, priority, is_active)")
        .in("listing_id", listingIds)
        .eq("is_active", true);

    const badgeMap = new Map<string, ListingBadge[]>();
    (data ?? []).forEach((row: any) => {
        const badges = badgeMap.get(row.listing_id) ?? [];
        badges.push({
            id: row.id,
            listing_id: row.listing_id,
            badge_id: row.badges?.id,
            badge: row.badges,
            assigned_by: null,
            assigned_at: "",
            expires_at: row.expires_at ?? null,
            note: null,
            is_active: row.is_active,
            created_at: "",
        });
        badgeMap.set(row.listing_id, badges);
    });

    return badgeMap;
}

export async function fetchLinkedListings(linkedListingIds: string[] = []): Promise<BlogLinkedListing[]> {
    const listingIds = Array.from(new Set(linkedListingIds.filter(Boolean)));
    if (listingIds.length === 0) return [];

    const admin = createAdminSupabaseClient();
    const { data: listings } = await admin
        .from("listings")
        .select("id, slug, business_name, short_description, logo_url, category_id, barangay_id, is_featured, is_premium")
        .in("id", listingIds)
        .eq("is_active", true)
        .in("status", ["approved", "claimed_pending"]);

    const listingRows = listings ?? [];
    const categoryIds = Array.from(new Set(listingRows.map((row: any) => row.category_id).filter(Boolean)));
    const barangayIds = Array.from(new Set(listingRows.map((row: any) => row.barangay_id).filter(Boolean)));

    const [{ data: categories }, { data: barangays }, badgeMap] = await Promise.all([
        categoryIds.length
            ? admin.from("categories").select("id, name, slug").in("id", categoryIds)
            : Promise.resolve({ data: [] } as any),
        barangayIds.length
            ? admin.from("barangays").select("id, name, slug").in("id", barangayIds)
            : Promise.resolve({ data: [] } as any),
        fetchListingBadges(listingIds),
    ]);

    const categoryMap = new Map<string, BlogListingCategory | null>(
        (categories ?? []).map((item: any) => [
            item.id,
            item?.name
                ? {
                    id: item.id,
                    name: item.name,
                    slug: item.slug,
                } satisfies BlogListingCategory
                : null,
        ])
    );
    const barangayMap = new Map<string, BlogListingBarangay | null>(
        (barangays ?? []).map((item: any) => [
            item.id,
            item?.name
                ? {
                    id: item.id,
                    name: item.name,
                    slug: item.slug,
                } satisfies BlogListingBarangay
                : null,
        ])
    );

    return listingRows.map((row: any) => ({
        id: row.id,
        slug: row.slug,
        business_name: row.business_name,
        short_description: row.short_description,
        logo_url: row.logo_url ?? null,
        image_url: row.logo_url ?? null,
        is_featured: Boolean(row.is_featured),
        is_premium: Boolean(row.is_premium),
        category: categoryMap.get(row.category_id) ?? null,
        barangay: barangayMap.get(row.barangay_id) ?? null,
        badges: badgeMap.get(row.id) ?? [],
    }));
}

function toBlogCard(post: BlogRow, authorMap: Map<string, BlogAuthor>): BlogPostCard {
    return {
        ...post,
        excerpt: post.excerpt || generateExcerpt(post.content, 240),
        tags: normalizeTags(post.tags),
        read_time: post.read_time || calculateReadTime(post.content),
        view_count: post.view_count ?? 0,
        is_featured: Boolean(post.is_featured),
        author: {
            id: post.author_id,
            name: post.author_name || authorMap.get(post.author_id)?.name || "GalaPo Team",
            avatar_url: authorMap.get(post.author_id)?.avatar_url ?? null,
            bio: DEFAULT_AUTHOR_BIO,
        },
    };
}

async function enrichBlogRows(rows: BlogRow[]) {
    const authorMap = await fetchAuthors(rows.map((row) => row.author_id));
    return rows.map((row) => toBlogCard(row, authorMap));
}

export async function getPublishedBlogPosts(query: PublishedBlogQuery = {}) {
    const admin = createAdminSupabaseClient();
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 50);
    const offset = (page - 1) * limit;

    let postsQuery = ensureLivePostFilter(
        admin
            .from("blog_posts")
            .select("id, title, slug, content, excerpt, featured_image_url, tags, linked_listing_ids, is_published, meta_title, meta_description, author_id, is_featured, view_count, read_time, published_at, created_at, updated_at", { count: "exact" })
    );

    if (query.tag) {
        postsQuery = postsQuery.contains("tags", [query.tag]);
    }

    if (query.search) {
        const safeSearch = query.search.replace(/,/g, " ");
        postsQuery = postsQuery.or(`title.ilike.%${safeSearch}%,content.ilike.%${safeSearch}%`);
    }

    if (query.featured) {
        postsQuery = postsQuery.eq("is_featured", true);
    }

    const [{ data: rawPosts, count }, { data: featuredRows }, { data: tagRows }] = await Promise.all([
        postsQuery
            .order("is_featured", { ascending: false })
            .order("published_at", { ascending: false, nullsFirst: false })
            .range(offset, offset + limit - 1),
        ensureLivePostFilter(
            admin
                .from("blog_posts")
                .select("id, title, slug, content, excerpt, featured_image_url, tags, linked_listing_ids, is_published, meta_title, meta_description, author_id, is_featured, view_count, read_time, published_at, created_at, updated_at")
        )
            .order("is_featured", { ascending: false })
            .order("published_at", { ascending: false, nullsFirst: false })
            .limit(1),
        ensureLivePostFilter(admin.from("blog_posts").select("tags")),
    ]);

    const posts = await enrichBlogRows((rawPosts ?? []) as BlogRow[]);
    const featuredPost = featuredRows?.length ? (await enrichBlogRows(featuredRows as BlogRow[]))[0] : null;
    const tags = extractUniqueTags((tagRows ?? []) as Array<{ tags?: string[] }>);

    return {
        data: posts,
        pagination: {
            total: count ?? posts.length,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil((count ?? posts.length) / limit)),
            hasNextPage: page * limit < (count ?? posts.length),
            hasPrevPage: page > 1,
        },
        featured_post: featuredPost,
        tags,
    };
}

export async function getPopularBlogPosts(limit = 5) {
    const admin = createAdminSupabaseClient();
    const { data } = await ensureLivePostFilter(
        admin
            .from("blog_posts")
            .select("id, title, slug, content, excerpt, featured_image_url, tags, linked_listing_ids, is_published, meta_title, meta_description, author_id, is_featured, view_count, read_time, published_at, created_at, updated_at")
    )
        .order("view_count", { ascending: false })
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(limit);

    return enrichBlogRows((data ?? []) as BlogRow[]);
}

export async function getBlogTags() {
    const admin = createAdminSupabaseClient();
    const { data } = await ensureLivePostFilter(admin.from("blog_posts").select("tags"));
    return extractUniqueTags((data ?? []) as Array<{ tags?: string[] }>);
}

async function getAdjacentPost(currentPost: BlogRow, direction: "previous" | "next"): Promise<BlogNavigationPost | null> {
    const admin = createAdminSupabaseClient();
    const referenceDate = currentPost.published_at ?? currentPost.created_at;
    let query = ensureLivePostFilter(
        admin.from("blog_posts").select("id, slug, title, published_at, created_at")
    ).neq("id", currentPost.id);

    if (direction === "previous") {
        query = query.lt("published_at", referenceDate).order("published_at", { ascending: false, nullsFirst: false }).limit(1);
    } else {
        query = query.gt("published_at", referenceDate).order("published_at", { ascending: true, nullsFirst: false }).limit(1);
    }

    const { data } = await query;
    const row = data?.[0];
    if (!row) return null;
    return { id: row.id, slug: row.slug, title: row.title };
}

export async function incrementBlogViewCount(slug: string) {
    const admin = createAdminSupabaseClient();
    const { data: current } = await admin
        .from("blog_posts")
        .select("id, view_count")
        .eq("slug", slug)
        .maybeSingle();

    if (!current?.id) return;

    await admin
        .from("blog_posts")
        .update({ view_count: (current.view_count ?? 0) + 1 })
        .eq("id", current.id);
}

export async function getBlogPostDetailBySlug(slug: string, options: { incrementView?: boolean } = {}) {
    const admin = createAdminSupabaseClient();
    const { data: post } = await ensureLivePostFilter(
        admin
            .from("blog_posts")
            .select("id, title, slug, content, excerpt, featured_image_url, tags, linked_listing_ids, is_published, meta_title, meta_description, author_id, is_featured, view_count, read_time, published_at, created_at, updated_at")
    )
        .eq("slug", slug)
        .maybeSingle();

    if (!post) return null;

    if (options.incrementView) {
        await incrementBlogViewCount(slug);
        post.view_count = (post.view_count ?? 0) + 1;
    }

    const [authorMap, linkedListings, allRelatedCandidates, previousPost, nextPost] = await Promise.all([
        fetchAuthors([post.author_id]),
        fetchLinkedListings(post.linked_listing_ids ?? []),
        ensureLivePostFilter(
            admin
                .from("blog_posts")
                .select("id, title, slug, content, excerpt, featured_image_url, tags, linked_listing_ids, is_published, meta_title, meta_description, author_id, is_featured, view_count, read_time, published_at, created_at, updated_at")
        )
            .neq("id", post.id)
            .order("published_at", { ascending: false, nullsFirst: false })
            .limit(12),
        getAdjacentPost(post as BlogRow, "previous"),
        getAdjacentPost(post as BlogRow, "next"),
    ]);

    const currentCard = toBlogCard(post as BlogRow, authorMap);
    const relatedCards = await enrichBlogRows((allRelatedCandidates.data ?? []) as BlogRow[]);

    return {
        ...currentCard,
        headings: extractHeadings(post.content),
        linked_listings: linkedListings,
        related_posts: getRelatedPosts(post as BlogRow, relatedCards, 3),
        previous_post: previousPost,
        next_post: nextPost,
    } satisfies BlogPostDetail;
}

export async function listAdminBlogPosts(query: AdminBlogQuery = {}) {
    const admin = createAdminSupabaseClient();
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const offset = (page - 1) * limit;

    let dbQuery = admin
        .from("blog_posts")
        .select("id, title, slug, content, excerpt, featured_image_url, tags, linked_listing_ids, is_published, meta_title, meta_description, author_id, is_featured, view_count, read_time, published_at, created_at, updated_at", { count: "exact" });

    if (query.status === "published") dbQuery = dbQuery.eq("is_published", true);
    if (query.status === "draft") dbQuery = dbQuery.eq("is_published", false);
    if (query.search) dbQuery = dbQuery.ilike("title", `%${query.search}%`);

    const { data, count } = await dbQuery
        .order("updated_at", { ascending: false })
        .range(offset, offset + limit - 1);

    const rows = (data ?? []) as BlogRow[];
    const cards = await enrichBlogRows(rows);

    return {
        data: cards.map((post) => ({
            ...post,
            linked_listing_count: post.linked_listing_ids?.length ?? 0,
        })),
        pagination: {
            total: count ?? rows.length,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil((count ?? rows.length) / limit)),
            hasNextPage: page * limit < (count ?? rows.length),
            hasPrevPage: page > 1,
        },
    };
}

export async function getAdminBlogPostById(id: string) {
    const admin = createAdminSupabaseClient();
    const { data } = await admin
        .from("blog_posts")
        .select("id, title, slug, content, excerpt, featured_image_url, tags, linked_listing_ids, is_published, meta_title, meta_description, author_id, is_featured, view_count, read_time, published_at, created_at, updated_at")
        .eq("id", id)
        .maybeSingle();

    if (!data) return null;

    const [authorMap, linkedListings] = await Promise.all([
        fetchAuthors([data.author_id]),
        fetchLinkedListings(data.linked_listing_ids ?? []),
    ]);

    return {
        ...toBlogCard(data as BlogRow, authorMap),
        headings: extractHeadings(data.content),
        linked_listings: linkedListings,
        related_posts: [],
        previous_post: null,
        next_post: null,
    } satisfies BlogPostDetail;
}

export async function getUniqueBlogSlug(input: string, excludeId?: string) {
    const admin = createAdminSupabaseClient();
    const baseSlug = generateSlug(input) || "blog-post";
    const { data } = await admin
        .from("blog_posts")
        .select("id, slug")
        .ilike("slug", `${baseSlug}%`);

    const usedSlugs = new Set(
        (data ?? [])
            .filter((row: any) => row.id !== excludeId)
            .map((row: any) => row.slug)
    );

    if (!usedSlugs.has(baseSlug)) return baseSlug;
    let suffix = 2;
    while (usedSlugs.has(`${baseSlug}-${suffix}`)) suffix += 1;
    return `${baseSlug}-${suffix}`;
}

async function unsetOtherFeaturedPosts(excludeId?: string) {
    const admin = createAdminSupabaseClient();
    let query = admin.from("blog_posts").update({ is_featured: false }).eq("is_featured", true);
    if (excludeId) query = query.neq("id", excludeId);
    await query;
}

function buildBlogPayload(input: SaveBlogPostInput, authorId?: string) {
    return {
        title: input.title.trim(),
        slug: input.slug,
        content: input.content || "<p></p>",
        excerpt: input.excerpt?.trim() || generateExcerpt(input.content || "", 300),
        featured_image_url: input.featured_image_url || null,
        tags: normalizeTags(input.tags),
        linked_listing_ids: Array.from(new Set((input.linked_listing_ids ?? []).filter(Boolean))),
        is_published: Boolean(input.is_published),
        is_featured: Boolean(input.is_featured),
        meta_title: input.meta_title?.trim() || null,
        meta_description: input.meta_description?.trim() || null,
        published_at: input.published_at || null,
        read_time: calculateReadTime(input.content || ""),
        author_name: input.author_name?.trim() || null,
        ...(authorId ? { author_id: authorId } : {}),
    };
}

export async function createAdminBlogPost(userId: string, input: SaveBlogPostInput) {
    const admin = createAdminSupabaseClient();
    const slug = await getUniqueBlogSlug(input.slug || input.title);
    const payload = buildBlogPayload({ ...input, slug }, userId);

    if (payload.is_featured) {
        await unsetOtherFeaturedPosts();
    }

    const { data, error } = await admin
        .from("blog_posts")
        .insert(payload)
        .select("id")
        .single();

    if (error) throw error;
    return getAdminBlogPostById(data.id);
}

export async function updateAdminBlogPost(id: string, input: SaveBlogPostInput) {
    const admin = createAdminSupabaseClient();
    const slug = await getUniqueBlogSlug(input.slug || input.title, id);
    const payload = {
        ...buildBlogPayload({ ...input, slug }),
        updated_at: new Date().toISOString(),
    };

    if (payload.is_featured) {
        await unsetOtherFeaturedPosts(id);
    }

    const { error } = await admin
        .from("blog_posts")
        .update(payload)
        .eq("id", id);

    if (error) throw error;
    return getAdminBlogPostById(id);
}

export async function deleteAdminBlogPost(id: string) {
    const admin = createAdminSupabaseClient();
    const { error } = await admin.from("blog_posts").delete().eq("id", id);
    if (error) throw error;
    return true;
}

export async function autosaveAdminBlogPost(id: string, input: { title?: string; content?: string }) {
    const admin = createAdminSupabaseClient();
    const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
    };

    if (typeof input.title === "string") updates.title = input.title;
    if (typeof input.content === "string") {
        updates.content = input.content;
        updates.read_time = calculateReadTime(input.content);
        updates.excerpt = generateExcerpt(input.content, 300);
    }

    const { error } = await admin.from("blog_posts").update(updates).eq("id", id);
    if (error) throw error;
    return { saved_at: new Date().toISOString() };
}

export async function uploadBlogImageFromFormData(formData: FormData, postId = "draft") {
    const admin = createAdminSupabaseClient();
    const file = formData.get("file");

    if (!(file instanceof File)) {
        throw new Error("No image file provided.");
    }
    if (!file.type.startsWith("image/")) {
        throw new Error("Uploaded file must be an image.");
    }

    const ext = file.name.split(".").pop() || "png";
    const filePath = `${postId}/inline-${Date.now()}.${ext}`;
    const { error } = await admin.storage
        .from("blog")
        .upload(filePath, file, { upsert: true, contentType: file.type });

    if (error) throw error;

    const { data } = admin.storage.from("blog").getPublicUrl(filePath);
    return { url: data.publicUrl };
}

export function decorateArticleHtml(htmlContent: string) {
    if (!htmlContent) return "";

    const headings = buildHeadingList(htmlContent);
    let headingIndex = 0;

    let html = htmlContent.replace(/<h([234])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, rawLevel, attrs, inner) => {
        const level = Number(rawLevel);
        if (level === 2 || level === 3) {
            const heading = headings[headingIndex];
            headingIndex += 1;
            const id = heading?.id || slugifyHeadingId(stripHtml(inner));
            return `<h${level}${attrs} id="${id}" class="group scroll-mt-24 font-bold tracking-tight"><a href="#${id}" class="no-underline hover:underline">${inner}</a></h${level}>`;
        }

        const id = slugifyHeadingId(stripHtml(inner));
        return `<h${level}${attrs} id="${id}" class="scroll-mt-24 font-semibold tracking-tight">${inner}</h${level}>`;
    });

    html = html.replace(/<a\s+([^>]*href=["']https?:\/\/[^"']+["'][^>]*)>/gi, '<a $1 target="_blank" rel="noopener noreferrer">');
    html = html.replace(/<blockquote(.*?)>/gi, '<blockquote$1 class="border-l-4 border-primary/30 pl-4 italic text-muted-foreground">');
    html = html.replace(/<pre(.*?)>/gi, '<pre$1 class="overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-slate-100">');
    html = html.replace(/<code(.*?)>/gi, '<code$1 class="rounded bg-muted px-1.5 py-0.5 text-[0.9em]">');
    html = html.replace(/<img(.*?)>/gi, '<img$1 class="mx-auto my-6 h-auto max-w-full rounded-2xl" />');
    html = html.replace(/<table(.*?)>/gi, '<table$1 class="w-full text-left text-sm">');
    html = html.replace(/<ul(.*?)>/gi, '<ul$1 class="list-disc pl-6">');
    html = html.replace(/<ol(.*?)>/gi, '<ol$1 class="list-decimal pl-6">');

    return html;
}

export function buildCanonicalBlogUrl(slug?: string) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://galapo.ph";
    return slug ? `${baseUrl}/olongapo/blog/${slug}` : `${baseUrl}/olongapo/blog`;
}