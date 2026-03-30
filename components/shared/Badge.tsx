import { cn } from "@/lib/utils";

type BadgeVariant = "featured" | "premium" | "new" | "deal" | "default";

const variantClasses: Record<BadgeVariant, string> = {
    featured: "bg-secondary text-white",
    premium: "bg-gradient-to-br from-[#FFD700] via-[#FFF4B0] to-[#B8860B] text-black shadow-sm border border-amber-400/30",
    new: "bg-emerald-500 text-white",
    deal: "bg-rose-500 text-white",
    default: "bg-muted text-muted-foreground",
};

interface BadgeProps {
    variant?: BadgeVariant;
    children: React.ReactNode;
    className?: string;
    animationType?: string | null;
    animationColor?: string | null;
}

export default function Badge({ variant = "default", children, className, animationType, animationColor }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase",
                variantClasses[variant],
                animationType && animationType !== "none" && `flair-anim-${animationType}`,
                className
            )}
            style={{ ["--flair-color" as any]: animationColor || undefined }}
        >
            {animationType === "twinkle" && (
                <>
                    <span className="flair-twinkle-star" style={{ top: "-4px", left: "10%", animationDelay: "0s" }}>★</span>
                    <span className="flair-twinkle-star" style={{ top: "40%", right: "-2px", animationDelay: "1s" }}>★</span>
                    <span className="flair-twinkle-star" style={{ bottom: "-4px", left: "30%", animationDelay: "2s" }}>★</span>
                </>
            )}
            {children}
        </span>
    );
}
