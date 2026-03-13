import { notFound } from "next/navigation";
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";
import BlogEditor from "@/components/admin/blog/BlogEditor";
import { getAdminBlogPostById } from "@/lib/blog-helpers";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditBlogPostPage({ params }: PageProps) {
    const { id } = await params;
    const post = await getAdminBlogPostById(id);
    if (!post) notFound();

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Edit Blog Post"
                description="Update content, SEO settings, and publishing options."
                breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Blog", href: "/admin/blog" }, { label: post.title }]}
            />
            <BlogEditor mode="edit" initialData={post} />
        </div>
    );
}