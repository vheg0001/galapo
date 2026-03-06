import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import Breadcrumbs from "@/components/shared/Breadcrumbs";

export const revalidate = 1800; // 30 minutes

interface Props {
    params: Promise<{ pageSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { pageSlug } = await params;
    const supabase = await createServerSupabaseClient();

    const { data } = await supabase
        .from("static_pages")
        .select("title, meta_title, meta_description")
        .eq("slug", pageSlug)
        .eq("is_published", true)
        .single();

    if (!data) return { title: "Page Not Found" };

    return {
        title: data.meta_title || data.title,
        description: data.meta_description || undefined,
        openGraph: {
            title: data.meta_title || data.title,
            description: data.meta_description || undefined,
        },
    };
}

export default async function StaticPage({ params }: Props) {
    const { pageSlug } = await params;
    const supabase = await createServerSupabaseClient();

    const { data: page, error } = await supabase
        .from("static_pages")
        .select("id, title, slug, content, meta_title, meta_description, updated_at")
        .eq("slug", pageSlug)
        .eq("is_published", true)
        .single();

    if (error || !page) {
        notFound();
    }

    // Format updatedAt for display
    const updatedAt = page.updated_at
        ? new Date(page.updated_at).toLocaleDateString("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        : null;

    return (
        <main className="container mx-auto max-w-4xl px-4 py-10">
            <Breadcrumbs
                items={[{ label: page.title }]}
                className="mb-6"
            />

            <article className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-sm">
                <header className="mb-8 border-b border-border pb-6">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        {page.title}
                    </h1>
                    {updatedAt && (
                        <p className="mt-2 text-sm text-muted-foreground">
                            Last updated: {updatedAt}
                        </p>
                    )}
                </header>

                <div
                    className="prose prose-neutral dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: page.content || "" }}
                />
            </article>
        </main>
    );
}
