"use client";

import { use } from "react";
import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";
import PageEditor from "@/components/admin/pages/PageEditor";

interface Props {
    params: Promise<{ id: string }>;
}

export default function AdminPageEditPage({ params }: Props) {
    const { id } = use(params);
    const isNew = id === "new";

    return (
        <div className="px-8 py-6 space-y-6">
            <AdminPageHeader
                title={isNew ? "New Page" : "Edit Page"}
                breadcrumbs={[
                    { label: "Admin" },
                    { label: "Pages", href: "/admin/pages" },
                    { label: isNew ? "New Page" : "Edit" },
                ]}
            />
            <PageEditor pageId={id} />
        </div>
    );
}
