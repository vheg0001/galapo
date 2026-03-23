import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
    text?: string;
}

const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-10 w-10",
};

export default function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
            <Loader2 className={cn("animate-spin text-secondary", sizeClasses[size])} />
            {text && <p className="text-sm text-muted-foreground">{text}</p>}
        </div>
    );
}
