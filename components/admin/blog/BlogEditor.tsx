"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { generateSlug } from "@/lib/utils";
import type { BlogLinkedListing, BlogPostDetail } from "@/lib/types";
import { generateExcerpt } from "@/lib/blog-helpers";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ContentEditor from "@/components/admin/blog/ContentEditor";
import PublishSettings from "@/components/admin/blog/PublishSettings";
import SEOPreview from "@/components/admin/blog/SEOPreview";
import EditorPreview from "@/components/admin/blog/EditorPreview";

interface BlogEditorProps {
    mode: "new" | "edit";
    initialData?: BlogPostDetail | null;
}

export default function BlogEditor({ mode, initialData }: BlogEditorProps) {
    const router = useRouter();
    const [form, setForm] = useState({
        title: initialData?.title || "",
        slug: initialData?.slug || "",
        featured_image_url: initialData?.featured_image_url || "",
        content: initialData?.content || "",
        excerpt: initialData?.excerpt || "",
        meta_title: initialData?.meta_title || "",
        meta_description: initialData?.meta_description || "",
        tags: (initialData?.tags || []).join(", "),
        is_published: initialData?.is_published || false,
        is_featured: initialData?.is_featured || false,
        published_at: initialData?.published_at ? new Date(initialData.published_at).toISOString().slice(0, 16) : "",
    });
    const [linkedListings, setLinkedListings] = useState<BlogLinkedListing[]>(initialData?.linked_listings || []);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    useEffect(() => {
        if (mode !== "new" && initialData) return;
        if (!form.title) return;
        setForm((current) => ({ ...current, slug: current.slug ? current.slug : generateSlug(form.title) }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.title]);

    useEffect(() => {
        const handler = (event: BeforeUnloadEvent) => {
            if (!saving) {
                event.preventDefault();
                event.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [saving]);

    useEffect(() => {
        if (mode !== "edit" || !initialData?.id) return;

        const interval = window.setInterval(async () => {
            await fetch(`/api/admin/blog/${initialData.id}/autosave`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: form.title, content: form.content }),
            });
            setLastSaved(new Date().toISOString());
        }, 60000);

        return () => window.clearInterval(interval);
    }, [mode, initialData?.id, form.title, form.content]);

    const parsedTags = useMemo(
        () => form.tags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 10),
        [form.tags]
    );

    const effectiveExcerpt = form.excerpt || generateExcerpt(form.content, 300);

    const handleSave = async (publish = false) => {
        setSaving(true);
        const payload = {
            ...form,
            excerpt: effectiveExcerpt,
            tags: parsedTags,
            linked_listing_ids: linkedListings.map((listing) => listing.id),
            is_published: publish ? true : form.is_published,
            published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
        };

        const endpoint = mode === "edit" && initialData?.id ? `/api/admin/blog/${initialData.id}` : "/api/admin/blog";
        const method = mode === "edit" ? "PUT" : "POST";
        const response = await fetch(endpoint, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        setSaving(false);
        if (!response.ok) return;
        setLastSaved(new Date().toISOString());
        router.push("/admin/blog");
        router.refresh();
    };

    const handleDelete = async () => {
        if (!(mode === "edit" && initialData?.id)) return;
        const confirmed = window.confirm("Delete this post permanently?");
        if (!confirmed) return;
        await fetch(`/api/admin/blog/${initialData.id}`, { method: "DELETE" });
        router.push("/admin/blog");
        router.refresh();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div>
                    <p className="text-sm font-semibold text-foreground">{mode === "edit" ? "Update blog post" : "Create a new blog post"}</p>
                    <p className="text-xs text-muted-foreground">{lastSaved ? `Last saved: ${new Date(lastSaved).toLocaleTimeString()}` : "Draft auto-saves every 60 seconds"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => window.open(`/olongapo/blog/${form.slug || "preview"}`, "_blank")} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">Preview</button>
                    <button type="button" onClick={() => handleSave(false)} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">Save Draft</button>
                    <button type="button" onClick={() => handleSave(true)} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">{mode === "edit" ? "Update" : "Publish"}</button>
                    {mode === "edit" ? <button type="button" onClick={handleDelete} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Delete</button> : null}
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
                <div className="space-y-6">
                    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Enter post title..." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug</Label>
                            <Input id="slug" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: generateSlug(event.target.value) }))} placeholder="post-slug" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="featuredImage">Featured Image URL</Label>
                            <Input id="featuredImage" value={form.featured_image_url} onChange={(event) => setForm((current) => ({ ...current, featured_image_url: event.target.value }))} placeholder="https://..." />
                        </div>
                        <ContentEditor
                            value={form.content}
                            onChange={(content) => setForm((current) => ({ ...current, content }))}
                            linkedListings={linkedListings}
                            onLinkedListingsChange={setLinkedListings}
                        />
                        <div className="space-y-2">
                            <Label htmlFor="tags">Tags</Label>
                            <Input id="tags" value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} placeholder="restaurants, food, guide" />
                            <p className="text-xs text-muted-foreground">Separate tags with commas. Max 10 tags.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="excerpt">Excerpt</Label>
                            <Textarea id="excerpt" value={form.excerpt} onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))} maxLength={300} placeholder="Short summary for the article..." />
                            <p className="text-xs text-muted-foreground">{effectiveExcerpt.length}/300 characters</p>
                        </div>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">SEO Settings</h3>
                        <div className="space-y-2">
                            <Label htmlFor="metaTitle">Meta Title</Label>
                            <Input id="metaTitle" value={form.meta_title} onChange={(event) => setForm((current) => ({ ...current, meta_title: event.target.value }))} maxLength={70} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="metaDescription">Meta Description</Label>
                            <Textarea id="metaDescription" value={form.meta_description} onChange={(event) => setForm((current) => ({ ...current, meta_description: event.target.value }))} maxLength={160} />
                        </div>
                        <SEOPreview title={form.meta_title || form.title} description={form.meta_description || effectiveExcerpt} slug={form.slug} />
                    </div>

                    <PublishSettings
                        isPublished={form.is_published}
                        isFeatured={form.is_featured}
                        publishedAt={form.published_at}
                        authorName={initialData?.author.name || "Current Admin"}
                        onChange={(field, value) => setForm((current) => ({ ...current, [field]: value }))}
                    />

                    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Linked Listings</h3>
                        {linkedListings.length === 0 ? <p className="text-sm text-muted-foreground">No linked listings yet.</p> : null}
                        <div className="space-y-2">
                            {linkedListings.map((listing) => (
                                <div key={listing.id} className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                                    <div>
                                        <p className="font-medium text-foreground">{listing.business_name}</p>
                                        <p className="text-sm text-muted-foreground">{[listing.category?.name, listing.barangay?.name].filter(Boolean).join(" · ")}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setLinkedListings((current) => current.filter((item) => item.id !== listing.id))}
                                        className="text-sm font-semibold text-red-600 hover:underline"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <EditorPreview
                    title={form.title}
                    excerpt={effectiveExcerpt}
                    featuredImageUrl={form.featured_image_url}
                    content={form.content}
                    linkedListings={linkedListings}
                />
            </div>
        </div>
    );
}