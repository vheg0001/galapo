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
            <article
                className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-headings:font-black prose-h2:text-3xl prose-h3:text-2xl prose-h4:text-xl prose-p:leading-8 prose-p:my-5 [&_li_p]:my-0 [&_li]:my-0 prose-ul:my-2 prose-ol:my-2 prose-a:text-primary prose-img:rounded-2xl dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: decorated }}
            />
        </div>
    );
}