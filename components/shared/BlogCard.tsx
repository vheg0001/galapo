import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/utils";

interface BlogCardProps {
    slug: string;
    title: string;
    excerpt?: string | null;
    featuredImageUrl?: string | null;
    publishedAt?: string | null;
}

export default function BlogCard({
    slug,
    title,
    excerpt,
    featuredImageUrl,
    publishedAt,
}: BlogCardProps) {
    return (
        <Link
            href={`/blog/${slug}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:-translate-y-1"
        >
            {/* Image */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                {featuredImageUrl ? (
                    <Image
                        src={featuredImageUrl}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-4xl">📝</div>
                )}
            </div>

            {/* Content */}
            <div className="flex flex-col p-4">
                {publishedAt && (
                    <time className="text-xs text-muted-foreground">{formatDate(publishedAt)}</time>
                )}
                <h3 className="mt-1.5 text-base font-semibold text-foreground line-clamp-2 group-hover:text-secondary transition-colors">
                    {title}
                </h3>
                {excerpt && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{excerpt}</p>
                )}
                <span className="mt-3 text-sm font-medium text-secondary group-hover:underline">
                    Read More →
                </span>
            </div>
        </Link>
    );
}
