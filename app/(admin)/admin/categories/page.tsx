import type { Metadata } from "next";
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const metadata: Metadata = {
    title: "Categories - GalaPo Admin",
    robots: { index: false, follow: false },
};

export const revalidate = 60;

type CategoryRow = {
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
    is_active: boolean;
    sort_order: number;
};

export default async function AdminCategoriesPage() {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
        .from("categories")
        .select("id, name, slug, parent_id, is_active, sort_order")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

    const categories = (data ?? []) as CategoryRow[];
    const parents = categories.filter((c) => !c.parent_id);
    const children = categories.filter((c) => !!c.parent_id);

    const childCountByParent = new Map<string, number>();
    for (const child of children) {
        const parentId = child.parent_id as string;
        childCountByParent.set(parentId, (childCountByParent.get(parentId) ?? 0) + 1);
    }

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Categories"
                description="Top-level categories and their subcategory counts."
                breadcrumbs={[
                    { label: "Admin", href: "/admin/dashboard" },
                    { label: "Categories" },
                ]}
            />

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    Failed to load categories. {error.message}
                </div>
            )}

            {!error && (
                <div className="rounded-2xl border border-border bg-background shadow-sm">
                    <div className="border-b border-border px-4 py-3">
                        <p className="text-sm font-semibold text-foreground">
                            {parents.length} top-level categories, {children.length} subcategories
                        </p>
                    </div>

                    {parents.length === 0 ? (
                        <div className="px-4 py-8 text-sm text-muted-foreground">
                            No categories found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Category</th>
                                        <th className="hidden px-4 py-3 font-semibold sm:table-cell">Slug</th>
                                        <th className="px-4 py-3 font-semibold">Subcategories</th>
                                        <th className="hidden px-4 py-3 font-semibold md:table-cell">Order</th>
                                        <th className="px-4 py-3 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parents.map((category) => (
                                        <tr key={category.id} className="border-t border-border">
                                            <td className="px-4 py-3 font-medium text-foreground">{category.name}</td>
                                            <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{category.slug}</td>
                                            <td className="px-4 py-3 text-foreground">{childCountByParent.get(category.id) ?? 0}</td>
                                            <td className="hidden px-4 py-3 text-foreground md:table-cell">{category.sort_order}</td>
                                            <td className="px-4 py-3">
                                                <span className={category.is_active ? "text-emerald-600" : "text-red-600"}>
                                                    {category.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
