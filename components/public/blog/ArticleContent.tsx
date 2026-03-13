import type { BlogLinkedListing } from "@/lib/types";
import { decorateArticleHtml } from "@/lib/blog-helpers";
import LinkedListingCard from "@/components/public/blog/LinkedListingCard";

interface ArticleContentProps {
    htmlContent: string;
    linkedListings?: BlogLinkedListing[];
}

export default function ArticleContent({ htmlContent, linkedListings = [] }: ArticleContentProps) {
    const decorated = decorateArticleHtml(htmlContent);

    return (
        <div className="space-y-8">
            {linkedListings.length > 0 ? <LinkedListingCard listing={linkedListings[0]} compact /> : null}

            <article
                className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-headings:font-black prose-h2:text-3xl prose-h3:text-2xl prose-h4:text-xl prose-p:leading-8 prose-a:text-primary prose-img:rounded-2xl prose-li:leading-7 dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: decorated }}
            />

            {linkedListings.length > 1 ? (
                <div className="space-y-4">
                    {linkedListings.slice(1).map((listing) => (
                        <LinkedListingCard key={listing.id} listing={listing} compact />
                    ))}
                </div>
            ) : null}
        </div>
    );
}