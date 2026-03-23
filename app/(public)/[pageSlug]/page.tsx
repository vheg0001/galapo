import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import PackagesGrid from "@/components/shared/PackagesGrid";

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

    // Fetch site settings to allow placeholder replacement (e.g., {{site_name}}, {{price_featured}})
    const { data: settingsData } = await supabase
        .from("site_settings")
        .select("key, value");

    const settings: Record<string, string> = {};
    settingsData?.forEach(s => {
        // Only allow replacing placeholders for simple values (not arrays/objects)
        if (typeof s.value === "string" || typeof s.value === "number") {
            settings[s.key] = String(s.value);
        }
    });

    const updatedAt = page.updated_at
        ? new Date(page.updated_at).toLocaleDateString("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "Asia/Manila",
        })
        : null;

    // Replace placeholders in content
    let processedContent = page.content || "";
    if (processedContent.includes("{{")) {
        Object.entries(settings).forEach(([key, value]) => {
            const placeholder = new RegExp(`{{${key}}}`, "g");
            processedContent = processedContent.replace(placeholder, value);
        });
    }

    // Some CMS pages inject the package heading as raw HTML before the grid placeholder.
    // Patch the section class directly so spacing is guaranteed on the rendered markup.
    processedContent = processedContent.replace(
        /<section class="not-prose mb-20 text-center">/g,
        '<section class="not-prose pt-10 mb-20 text-center">'
    );
    processedContent = processedContent.replace(
        /<h2 class="text-3xl font-bold text-slate-900">\s*Choose Your Advertising Package\s*<\/h2>/g,
        '<h2 class="text-3xl font-bold text-slate-900" style="margin-top: 2.5rem;">Choose Your Advertising Package</h2>'
    );

    // Split content if it includes the packages grid placeholder
    const parts = processedContent.split("{{PACKAGES_GRID}}");
    const hasGrid = parts.length > 1;
    const advertisingPackages = settingsData?.find(s => s.key === "advertising_packages")?.value || [];

    const proseClassName = hasGrid
        ? "prose prose-neutral max-w-none dark:prose-invert prose-h2:mt-14 prose-h2:mb-4 prose-h3:mt-10"
        : "prose prose-neutral max-w-none dark:prose-invert";

    return (
        <main className={`container mx-auto px-4 py-10 transition-all ${hasGrid ? "max-w-[1400px]" : "max-w-4xl"}`}>

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

                <div className={proseClassName}>
                    {parts.map((part: string, i: number) => (
                        <React.Fragment key={i}>
                            <div dangerouslySetInnerHTML={{ __html: part }} />
                            {i < parts.length - 1 && advertisingPackages.length > 0 && (
                                <PackagesGrid packages={advertisingPackages} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </article>
        </main>
    );
}
