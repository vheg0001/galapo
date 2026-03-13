interface ReadTimeProps {
    minutes?: number | null;
    className?: string;
}

export default function ReadTime({ minutes = 1, className }: ReadTimeProps) {
    return <span className={className}>{Math.max(1, minutes ?? 1)} min read</span>;
}