"use client";

interface ResultsCountProps {
    showing: number;
    total: number;
    className?: string;
}

export default function ResultsCount({ showing, total, className = "" }: ResultsCountProps) {
    return (
        <p className={`text-sm text-muted-foreground ${className}`}>
            Showing <span className="font-semibold text-foreground">{showing}</span> of{" "}
            <span className="font-semibold text-foreground">{total}</span> results
        </p>
    );
}
