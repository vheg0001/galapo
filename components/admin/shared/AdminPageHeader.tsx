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
        <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between py-2", className)}>
            <div className="space-y-1">
                {breadcrumbs.length > 0 && (
                    <nav className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {breadcrumbs.map((crumb, i) => (
                            <span key={i} className="flex items-center gap-1.5">
                                {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" />}
                                {crumb.href ? (
                                    <Link
                                        href={crumb.href}
                                        className="rounded-md px-2 py-1 transition-colors hover:bg-muted hover:text-foreground"
                                    >
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className="rounded-md bg-muted/50 px-2 py-1 text-foreground shadow-sm ring-1 ring-border/50">
                                        {crumb.label}
                                    </span>
                                )}
                            </span>
                        ))}
                    </nav>
                )}
                <h1 className="text-3xl font-black tracking-tight text-foreground">{title}</h1>
                {description && <p className="mt-1 text-sm font-medium text-muted-foreground">{description}</p>}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-3 mt-4 sm:mt-0">{actions}</div>}
        </div>
    );
}
