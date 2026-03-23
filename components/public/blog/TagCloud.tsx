import Link from "next/link";
import type { TagCount } from "@/lib/types";

function buildTagHref(basePath: string, tag?: string) {
    const [pathname, queryString = ""] = basePath.split("?");
    const params = new URLSearchParams(queryString);

    if (pathname.includes("/tag/")) {
        if (!tag) return "/olongapo/blog";
        params.delete("tag");
        const query = params.toString();
        return `/olongapo/blog/tag/${encodeURIComponent(tag)}${query ? `?${query}` : ""}`;
    }

    if (!tag) {
        params.delete("tag");
    } else {
        params.set("tag", tag);
    }

    const query = params.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
}

interface TagCloudProps {
    tags: TagCount[];
    activeTag?: string | null;
    basePath?: string;
    showAllChip?: boolean;
}

export default function TagCloud({ tags, activeTag, basePath = "/olongapo/blog", showAllChip = false }: TagCloudProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {showAllChip && (
                <Link
                    href={buildTagHref(basePath)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${!activeTag ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-accent"}`}
                >
                    All
                </Link>
            )}
            {tags.map((tag) => {
                const isActive = activeTag?.toLowerCase() === tag.tag.toLowerCase();
                return (
                    <Link
                        key={tag.tag}
                        href={buildTagHref(basePath, tag.tag)}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-accent"}`}
                    >
                        {tag.tag} <span className="text-xs opacity-80">({tag.count})</span>
                    </Link>
                );
            })}
        </div>
    );
}