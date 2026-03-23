import Link from "next/link";
import { ShieldCheck } from "lucide-react";

interface ClaimBannerProps {
    slug: string;
    businessName: string;
}

export default function ClaimBanner({ slug, businessName }: ClaimBannerProps) {
    return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 text-center shadow-sm">
            <div className="flex flex-col items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                    <ShieldCheck size={24} />
                </div>
                <div className="space-y-1">
                    <h4 className="text-sm font-bold text-gray-900">Is this your business?</h4>
                    <p className="text-xs leading-relaxed text-gray-500">
                        Claim <b>{businessName}</b> to manage your profile, respond to reviews, and see analytics.
                    </p>
                </div>
                <Link
                    href={`/claim/${slug}`}
                    className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-amber-700 active:scale-[0.98]"
                >
                    Claim it for free
                </Link>
            </div>
        </div>
    );
}
