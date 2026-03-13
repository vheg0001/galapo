import Link from "next/link";
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";
import BlogManagementTable from "@/components/admin/blog/BlogManagementTable";

export default function AdminBlogPage() {
    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Blog Management"
                description="Create, edit, publish, and feature blog posts for GalaPo."
                breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Blog" }]}
                actions={
                    <Link href="/admin/blog/new" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                        New Post
                    </Link>
                }
            />

            <BlogManagementTable />
        </div>
    );
}