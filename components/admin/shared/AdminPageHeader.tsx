import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Breadcrumb {
    label: string;
    href?: string;
}

interface AdminPageHeaderProps {
    title: string;
    description?: string;
    breadcrumbs?: Breadcrumb[];
    actions?: React.ReactNode;
    className?: string;
}

export default function AdminPageHeader({ title, description, breadcrumbs = [], actions, className }: AdminPageHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between", className)}>
            <div>
                {breadcrumbs.length > 0 && (
                    <nav className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                        {breadcrumbs.map((crumb, i) => (
                            <span key={i} className="flex items-center gap-1">
                                {i > 0 && <ChevronRight className="h-3 w-3" />}
                                {crumb.href ? (
                                    <Link href={crumb.href} className="hover:text-foreground transition">{crumb.label}</Link>
                                ) : (
                                    <span className="text-foreground font-medium">{crumb.label}</span>
                                )}
                            </span>
                        ))}
                    </nav>
                )}
                <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2 mt-3 sm:mt-0">{actions}</div>}
        </div>
    );
}
