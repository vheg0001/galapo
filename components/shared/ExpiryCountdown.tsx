"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpiryCountdownProps {
    endDate: string;
    className?: string;
}

export default function ExpiryCountdown({ endDate, className }: ExpiryCountdownProps) {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        total: number;
    }>({ days: 0, hours: 0, minutes: 0, total: 0 });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(endDate).getTime() - new Date().getTime();
            if (difference <= 0) {
                return { days: 0, hours: 0, minutes: 0, total: 0 };
            }

            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                total: difference,
            };
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, [endDate]);

    if (timeLeft.total <= 0) return null;

    const isToday = timeLeft.days === 0;
    const isUrgent = timeLeft.days <= 7;

    return (
        <div className={cn(
            "flex items-center gap-1.5 text-xs font-bold",
            isToday ? "text-red-600 animate-pulse" :
                isUrgent ? "text-amber-600" :
                    "text-muted-foreground",
            className
        )}>
            <Clock className={cn("h-3.5 w-3.5", isToday && "fill-red-600/20")} />
            <span>
                {isToday ? "Expires TODAY" :
                    timeLeft.days <= 7 ? `Expires in ${timeLeft.days} ${timeLeft.days === 1 ? 'day' : 'days'}` :
                        `Expires ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            </span>
        </div>
    );
}
