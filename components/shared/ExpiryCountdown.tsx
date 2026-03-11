"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpiryCountdownProps {
    endDate: string;
    startDate?: string;
    className?: string;
}

export default function ExpiryCountdown({ endDate, startDate, className }: ExpiryCountdownProps) {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
        total: number;
        isUpcoming: boolean;
    }>({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, isUpcoming: false });

    useEffect(() => {
        let timerId: NodeJS.Timeout;

        const calculateTime = () => {
            const now = new Date();
            const start = startDate ? new Date(startDate) : null;
            const end = new Date(endDate);
            
            // If the date is exactly at midnight UTC, treat it as expiring at the very end of the day.
            const isMidnightUTC = (date: Date) => 
                date.getUTCHours() === 0 && 
                date.getUTCMinutes() === 0 && 
                date.getUTCSeconds() === 0;

            if (isMidnightUTC(end)) {
                end.setUTCHours(23, 59, 59, 999);
            }

            let targetDate = end;
            let isUpcoming = false;

            // If it hasn't started yet, countdown to start
            if (start && now < start) {
                targetDate = start;
                isUpcoming = true;
            }

            const difference = targetDate.getTime() - now.getTime();
            if (difference <= 0) {
                return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, isUpcoming };
            }

            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
                total: difference,
                isUpcoming
            };
        };

        const updateTimer = () => {
            const time = calculateTime();
            setTimeLeft(time);

            if (time.total <= 0) return;

            // If less than 24 hours left, update every second for the live countdown.
            // Otherwise, update every minute to save resources.
            const nextInterval = time.days === 0 ? 1000 : 60000;
            timerId = setTimeout(updateTimer, nextInterval);
        };

        updateTimer();
        return () => clearTimeout(timerId);
    }, [endDate, startDate]);

    if (timeLeft.total <= 0) return null;

    const isToday = timeLeft.days === 0;
    const isUrgent = timeLeft.days <= 7;

    // Format numbers to have leading zeros - handle undefined/NaN for robustness
    const format = (num: number | undefined) => {
        if (num === undefined || isNaN(num)) return "00";
        return num.toString().padStart(2, '0');
    };

    return (
        <div className={cn(
            "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider",
            isToday ? "text-red-600" :
                isUrgent ? "text-amber-600" :
                    "text-muted-foreground/60",
            className
        )}>
            <Clock className={cn("h-3.5 w-3.5", isToday && "animate-pulse fill-red-600/20")} />
            <span className="tabular-nums">
                {timeLeft.isUpcoming ? (
                    <span className="flex items-center gap-1">
                        Starts in {timeLeft.days > 0 ? `${timeLeft.days}d ` : ""}{format(timeLeft.hours)}:{format(timeLeft.minutes)}:{format(timeLeft.seconds)}
                    </span>
                ) : isToday ? (
                    <span className="flex items-center gap-1">
                        EXPIRES: {format(timeLeft?.hours)}:{format(timeLeft?.minutes)}:{format(timeLeft?.seconds)}
                    </span>
                ) :
                    timeLeft.days <= 7 ? `Expires in ${timeLeft.days} ${timeLeft.days === 1 ? 'day' : 'days'}` :
                        `Expires ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            </span>
        </div>
    );
}
