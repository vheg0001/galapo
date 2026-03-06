"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, FileText, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";

export default function AdminPagesPage() {
    const [pages, setPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        const res = await fetch("/api/admin/pages");
        const data = await res.json();
        setPages(data.data ?? []);
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    async function togglePublished(page: any) {
        await fetch(`/api/admin/pages/${page.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_published: !page.is_published }),
        });
        load();
    }

    async function handleDelete(page: any) {
        if (!window.confirm(`Delete "${page.title}"? This cannot be undone.`)) return;
        const res = await fetch(`/api/admin/pages/${page.id}`, { method: "DELETE" });
        if (res.ok) load();
        else alert("Failed to delete page.");
    }

    return (
        <div className="px-8 py-6 space-y-6">
            <AdminPageHeader
                title="Static Pages"
                description="Manage static content pages like About, Privacy Policy, Terms, etc."
                breadcrumbs={[{ label: "Admin" }, { label: "Pages" }]}
                actions={
                    <Link
                        href="/admin/pages/new/edit"
                        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        Add Page
                    </Link>
                }
            />

            <div className="overflow-hidden rounded-[2rem] border border-border/50 bg-background/40 shadow-sm backdrop-blur-sm ring-1 ring-border/50">
                <table className="w-full text-sm">
                    <thead className="border-b border-border/50 bg-muted/20 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        <tr>
                            <th className="px-6 py-4 text-left">Title</th>
                            <th className="px-6 py-4 text-left">Slug</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-left">Last Updated</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        {loading ? (
                            [...Array(4)].map((_, i) => (
                                <tr key={i}>
                                    {[...Array(5)].map((_, j) => (
                                        <td key={j} className="px-6 py-4"><div className="h-4 rounded bg-muted/50 animate-pulse" /></td>
                                    ))}
                                </tr>
                            ))
                        ) : pages.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-20 text-center text-sm text-muted-foreground">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="rounded-full bg-muted/30 p-4"><FileText className="h-8 w-8 text-muted-foreground/30" /></div>
                                        <p>No pages yet. Create your first static page.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : pages.map((page) => (
                            <tr key={page.id} className="transition-colors hover:bg-muted/20">
                                <td className="px-6 py-4 font-semibold">
                                    <Link href={`/admin/pages/${page.id}/edit`} className="hover:text-primary transition-colors">
                                        {page.title}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs text-muted-foreground">/{page.slug}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${page.is_published ? "bg-emerald-500/10 text-emerald-600" : "bg-muted/50 text-muted-foreground"}`}>
                                        {page.is_published ? "Published" : "Draft"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                    {new Date(page.updated_at || page.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <Link
                                            href={`/admin/pages/${page.id}/edit`}
                                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                                            title="Edit"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => togglePublished(page)}
                                            className={`rounded-lg p-1.5 transition-colors cursor-pointer ${page.is_published ? "text-emerald-600 hover:bg-muted" : "text-muted-foreground hover:bg-muted"}`}
                                            title={page.is_published ? "Unpublish" : "Publish"}
                                        >
                                            {page.is_published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(page)}
                                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-600 transition-colors cursor-pointer"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
