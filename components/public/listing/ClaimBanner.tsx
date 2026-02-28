import Link from "next/link";
import { ShieldCheck } from "lucide-react";

interface ClaimBannerProps {
    slug: string;
    businessName: string;
}

export default function ClaimBanner({ slug, businessName }: ClaimBannerProps) {
    return (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center">
            <div className="flex flex-col items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-muted-foreground/60" />
                <p className="text-sm text-muted-foreground">
                    Is this your business?{" "}
                    <Link
                        href={`/claim/${slug}`}
                        className="font-semibold text-primary hover:underline"
                    >
                        Claim it for free
                    </Link>
                </p>
                <p className="text-xs text-muted-foreground/60">
                    Manage your listing, add photos, respond to reviews, and more.
                </p>
            </div>
        </div>
    );
}
