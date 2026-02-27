import { cn } from "@/lib/utils";

type BadgeVariant = "featured" | "premium" | "new" | "deal" | "default";

const variantClasses: Record<BadgeVariant, string> = {
    featured: "bg-secondary text-white",
    premium: "bg-gradient-to-r from-amber-500 to-amber-600 text-white",
    new: "bg-emerald-500 text-white",
    deal: "bg-rose-500 text-white",
    default: "bg-muted text-muted-foreground",
};

interface BadgeProps {
    variant?: BadgeVariant;
    children: React.ReactNode;
    className?: string;
}

export default function Badge({ variant = "default", children, className }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase",
                variantClasses[variant],
                className
            )}
        >
            {children}
        </span>
    );
}
