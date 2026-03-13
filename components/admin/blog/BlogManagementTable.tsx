"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import DataTable, { type Column } from "@/components/admin/shared/DataTable";
import type { BlogPostCard } from "@/lib/types";

type BlogRow = BlogPostCard & { linked_listing_count?: number };

export default function BlogManagementTable() {
    const [posts, setPosts] = useState<BlogRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("all");
    const [search, setSearch] = useState("");

    const loadPosts = async () => {
        setLoading(true);
        const params = new URLSearchParams({ status, search, page: "1", limit: "100" });
        const response = await fetch(`/api/admin/blog?${params.toString()}`);
        const payload = await response.json();
        setPosts(payload.data || []);
        setLoading(false);
    };

    useEffect(() => {
        void loadPosts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    const filteredPosts = useMemo(() => {
        if (!search.trim()) return posts;
        return posts.filter((post) => post.title.toLowerCase().includes(search.toLowerCase()));
    }, [posts, search]);

    const togglePublished = async (post: BlogRow) => {
        await fetch(`/api/admin/blog/${post.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: post.title,
                slug: post.slug,
                content: post.content,
                excerpt: post.excerpt,
                featured_image_url: post.featured_image_url,
                tags: post.tags,
                linked_listing_ids: post.linked_listing_ids,
                is_published: !post.is_published,
                is_featured: post.is_featured,
                meta_title: post.meta_title,
                meta_description: post.meta_description,
                published_at: post.published_at,
            }),
        });
        void loadPosts();
    };

    const toggleFeatured = async (post: BlogRow) => {
        await fetch(`/api/admin/blog/${post.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: post.title,
                slug: post.slug,
                content: post.content,
                excerpt: post.excerpt,
                featured_image_url: post.featured_image_url,
                tags: post.tags,
                linked_listing_ids: post.linked_listing_ids,
                is_published: post.is_published,
                is_featured: !post.is_featured,
                meta_title: post.meta_title,
                meta_description: post.meta_description,
                published_at: post.published_at,
            }),
        });
        void loadPosts();
    };

    const deletePost = async (post: BlogRow) => {
        if (!window.confirm(`Delete “${post.title}”?`)) return;
        await fetch(`/api/admin/blog/${post.id}`, { method: "DELETE" });
        void loadPosts();
    };

    const columns: Column<BlogRow>[] = [
        {
            key: "featured_image_url",
            header: "Image",
            render: (row) => (
                <div className="h-12 w-16 overflow-hidden rounded-lg bg-muted">
                    {row.featured_image_url ? <img src={row.featured_image_url} alt={row.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[10px] font-bold text-primary">GP</div>}
                </div>
            ),
        },
        { key: "title", header: "Title", sortable: true },
        {
            key: "tags",
            header: "Tags",
            render: (row) => <div className="flex flex-wrap gap-1">{row.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-muted px-2 py-1 text-[11px]">{tag}</span>)}</div>,
            csvValue: (row) => row.tags.join(", "),
        },
        {
            key: "status",
            header: "Status",
            render: (row) => <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.is_published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{row.is_published ? "Published" : "Draft"}</span>,
        },
        {
            key: "published_at",
            header: "Published",
            render: (row) => row.published_at ? new Date(row.published_at).toLocaleDateString() : "—",
        },
        {
            key: "view_count",
            header: "Views",
            sortable: true,
            render: (row) => row.view_count ?? 0,
        },
        {
            key: "actions",
            header: "Actions",
            render: (row) => (
                <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/blog/${row.id}/edit`} className="rounded-lg border border-border px-2 py-1 text-xs font-semibold hover:bg-muted">Edit</Link>
                    <button type="button" onClick={() => togglePublished(row)} className="rounded-lg border border-border px-2 py-1 text-xs font-semibold hover:bg-muted">{row.is_published ? "Unpublish" : "Publish"}</button>
                    <button type="button" onClick={() => toggleFeatured(row)} className="rounded-lg border border-border px-2 py-1 text-xs font-semibold hover:bg-muted">{row.is_featured ? "Unfeature" : "Feature"}</button>
                    <button type="button" onClick={() => deletePost(row)} className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">Delete</button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-xl border border-border bg-background px-3 text-sm">
                    <option value="all">All</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                </select>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title" className="h-10 min-w-[240px] rounded-xl border border-border bg-background px-3 text-sm" />
                <div className="text-xs text-muted-foreground">Drag-to-reorder featured posts can be layered on top of the featured toggle once ordering is introduced in the schema.</div>
            </div>
            <DataTable data={filteredPosts} columns={columns} keyField="id" searchable={false} isLoading={loading} persistKey="admin-blog-posts" />
        </div>
    );
}