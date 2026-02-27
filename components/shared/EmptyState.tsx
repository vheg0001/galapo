import { SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                {icon || <SearchX className="h-8 w-8 text-muted-foreground" />}
            </div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {description && (
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
            )}
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}
