import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";
import BlogEditor from "@/components/admin/blog/BlogEditor";

export default function NewBlogPostPage() {
    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="New Blog Post"
                description="Draft a new GalaPo blog story, guide, or local feature."
                breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Blog", href: "/admin/blog" }, { label: "New Post" }]}
            />
            <BlogEditor mode="new" />
        </div>
    );
}