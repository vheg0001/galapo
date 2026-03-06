"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Save, Eye, Loader2, ArrowLeft } from "lucide-react";
import RichTextEditor from "./RichTextEditor";

function toSlug(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

interface PageEditorProps {
    pageId: string;
}

export default function PageEditor({ pageId }: PageEditorProps) {
    const router = useRouter();
    const isNew = pageId === "new";
    const [form, setForm] = useState({
        title: "",
        slug: "",
        content: "<p></p>",
        meta_title: "",
        meta_description: "",
        is_published: false,
    });
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [autoSlug, setAutoSlug] = useState(isNew);

    useEffect(() => {
        if (!isNew) {
            fetch(`/api/admin/pages/${pageId}`)
                .then((r) => r.json())
                .then((data) => {
                    if (data.data) setForm(data.data);
                    setLoading(false);
                });
        }
    }, [pageId, isNew]);

    const handleTitleChange = useCallback((title: string) => {
        setForm((prev) => ({
            ...prev,
            title,
            slug: autoSlug ? toSlug(title) : prev.slug,
        }));
    }, [autoSlug]);

    async function handleSave() {
        if (!form.title || !form.slug) return;
        setSaving(true);
        setSaved(false);

        const url = isNew ? "/api/admin/pages" : `/api/admin/pages/${pageId}`;
        const method = isNew ? "POST" : "PATCH";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });

        setSaving(false);

        if (res.ok) {
            const data = await res.json();
            setSaved(true);
            if (isNew) {
                router.replace(`/admin/pages/${data.data.id}/edit`);
            }
            setTimeout(() => setSaved(false), 3000);
        } else {
            const err = await res.json();
            alert(err.error || "Failed to save");
        }
    }

    const metaTitleCount = form.meta_title.length;
    const metaDescCount = form.meta_description.length;

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top action bar */}
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => router.push("/admin/pages")}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Pages
                </button>
                <div className="flex items-center gap-3">
                    {!isNew && form.slug && (
                        <a
                            href={`/pages/${form.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-xl border border-border/50 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                        >
                            <Eye className="h-4 w-4" />
                            Preview
                        </a>
                    )}
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all ${saved ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"} disabled:opacity-50`}
                    >
                        <Save className="h-4 w-4" />
                        {saving ? "Saving..." : saved ? "Saved!" : "Save Page"}
                    </button>
                </div>
            </div>

            {/* Title & Slug */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Page Title <span className="text-red-500">*</span></label>
                    <input
                        className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                        placeholder="About GalaPo"
                        value={form.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Slug <span className="text-red-500">*</span></label>
                    <input
                        className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm font-mono outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                        placeholder="about-galapo"
                        value={form.slug}
                        onChange={(e) => { setAutoSlug(false); setForm((p) => ({ ...p, slug: e.target.value })); }}
                    />
                </div>
            </div>

            {/* Rich Text Editor */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Content</label>
                <RichTextEditor
                    value={form.content}
                    onChange={(html) => setForm((p) => ({ ...p, content: html }))}
                    placeholder="Start writing your page content..."
                    minHeight="500px"
                />
            </div>

            {/* SEO Section */}
            <div className="rounded-2xl border border-border/50 bg-muted/10 p-6 space-y-4">
                <h4 className="text-sm font-bold text-foreground">SEO Settings</h4>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-muted-foreground">Meta Title</label>
                        <span className={`text-[10px] font-semibold ${metaTitleCount > 70 ? "text-red-500" : "text-muted-foreground"}`}>
                            {metaTitleCount}/70
                        </span>
                    </div>
                    <input
                        className="w-full rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                        placeholder="Override page title for search engines..."
                        value={form.meta_title}
                        maxLength={80}
                        onChange={(e) => setForm((p) => ({ ...p, meta_title: e.target.value }))}
                    />
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-muted-foreground">Meta Description</label>
                        <span className={`text-[10px] font-semibold ${metaDescCount > 160 ? "text-red-500" : "text-muted-foreground"}`}>
                            {metaDescCount}/160
                        </span>
                    </div>
                    <textarea
                        className="w-full resize-none rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                        placeholder="Brief description for search engines (max 160 chars)..."
                        value={form.meta_description}
                        maxLength={200}
                        rows={3}
                        onChange={(e) => setForm((p) => ({ ...p, meta_description: e.target.value }))}
                    />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={form.is_published}
                        onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))}
                        className="h-4 w-4 accent-primary rounded"
                    />
                    <span className="text-sm font-medium">Published (visible to public)</span>
                </label>
            </div>
        </div>
    );
}
