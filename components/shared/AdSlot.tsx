import { createServerSupabaseClient } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";

interface AdSlotProps {
    location: string;
    position?: number;
    className?: string;
}

export default async function AdSlot({ location, position = 1, className }: AdSlotProps) {
    const supabase = await createServerSupabaseClient();

    // Find an active internal ad for this placement
    const now = new Date().toISOString().split("T")[0];
    const { data: ad } = await supabase
        .from("ad_placements")
        .select("id, title, image_url, target_url")
        .eq("placement_location", location)
        .eq("is_active", true)
        .eq("is_adsense", false)
        .lte("start_date", now)
        .gte("end_date", now)
        .order("created_at", { ascending: false })
        .range((position - 1), (position - 1))
        .maybeSingle();

    // If internal ad exists
    if (ad?.image_url && ad.target_url) {
        // Track impression (fire and forget via edge function in production)
        return (
            <div className={className}>
                <Link
                    href={ad.target_url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="block overflow-hidden rounded-xl"
                >
                    <Image
                        src={ad.image_url}
                        alt={ad.title || "Advertisement"}
                        width={728}
                        height={90}
                        className="mx-auto w-full max-w-3xl"
                        sizes="(max-width: 768px) 100vw, 728px"
                    />
                </Link>
            </div>
        );
    }

    // Fallback: render nothing (AdSense integration placeholder for later)
    return null;
}
