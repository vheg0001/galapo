import Link from "next/link";
import type { BlogAuthor } from "@/lib/types";
import LazyImage from "@/components/shared/LazyImage";

interface AuthorBioProps {
    author: BlogAuthor;
}

export default function AuthorBio({ author }: AuthorBioProps) {
    return (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start gap-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted">
                    {author.avatar_url ? (
                        <LazyImage src={author.avatar_url} alt={author.name} className="object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-bold text-primary">{author.name.charAt(0)}</div>
                    )}
                </div>
                <div>
                    <h2 className="text-lg font-bold text-foreground">{author.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{author.bio || "Contributor to the GalaPo Blog covering local culture, food, and city discoveries."}</p>
                    <Link href={`/olongapo/blog?search=${encodeURIComponent(author.name)}`} className="mt-3 inline-block text-sm font-semibold text-secondary hover:underline">
                        View all posts by {author.name}
                    </Link>
                </div>
            </div>
        </section>
    );
}