import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { isToday as checkIsToday } from "@/lib/calendar-helpers";

interface DateBadgeProps {
    date: string | Date;
    size?: "sm" | "md" | "lg";
    className?: string;
}

function toDate(value: string | Date) {
    if (value instanceof Date) return value;

    const withTime = value.includes("T") ? value : `${value}T00:00:00`;
    const parsed = parseISO(withTime);

    if (Number.isNaN(parsed.getTime())) {
        return new Date(value);
    }

    return parsed;
}

const sizeClasses = {
    sm: {
        wrapper: "min-w-[3.25rem] rounded-xl px-2.5 py-2",
        month: "text-[10px]",
        day: "text-xl",
    },
    md: {
        wrapper: "min-w-[3.75rem] rounded-2xl px-3 py-2.5",
        month: "text-[11px]",
        day: "text-2xl",
    },
    lg: {
        wrapper: "min-w-[4.75rem] rounded-[1.5rem] px-4 py-3",
        month: "text-xs",
        day: "text-3xl",
    },
} as const;

export default function DateBadge({ date, size = "md", className }: DateBadgeProps) {
    const parsedDate = toDate(date);
    const today = checkIsToday(parsedDate);
    const styles = sizeClasses[size];

    return (
        <div
            data-today={today ? "true" : "false"}
            className={cn(
                "inline-flex flex-col items-center justify-center border text-center shadow-sm",
                today
                    ? "border-primary/20 bg-primary text-primary-foreground ring-4 ring-primary/10"
                    : "border-border/60 bg-white text-foreground",
                styles.wrapper,
                className
            )}
        >
            <span className={cn("font-black uppercase tracking-[0.2em] leading-none", styles.month)}>
                {format(parsedDate, "MMM").toUpperCase()}
            </span>
            <span className={cn("font-black leading-none", styles.day)}>{format(parsedDate, "d")}</span>
        </div>
    );
}