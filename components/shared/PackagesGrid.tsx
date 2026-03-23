import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

interface Package {
    id: string;
    name: string;
    price: string;
    interval: string;
    description: string;
    features: string[];
    is_popular: boolean;
    button_text: string;
    button_link: string;
}

interface PackagesGridProps {
    packages: Package[];
}

export default function PackagesGrid({ packages }: PackagesGridProps) {
    if (!packages || packages.length === 0) return null;

    const count = packages.length;
    const gridCols = count >= 5 ? "lg:grid-cols-5" : count === 4 ? "lg:grid-cols-4" : count === 3 ? "lg:grid-cols-3" : count === 2 ? "md:grid-cols-2" : "max-w-md mx-auto";

    return (
        <div className={`grid gap-6 pt-10 not-prose ${gridCols}`}>
            {packages.map((pkg) => (
                <div
                    key={pkg.id}
                    className={`rounded-3xl border-2 flex flex-col relative transition-all duration-300 ${pkg.is_popular
                        ? 'border-primary shadow-2xl scale-105 bg-card z-10'
                        : 'border-border/50 bg-card/50 hover:border-border'
                        } ${count >= 5 ? 'p-5' : 'p-8'}`}
                >
                    {pkg.is_popular && (
                        <div className="absolute left-1/2 -translate-x-1/2 rounded-full bg-primary px-5 py-2 text-[10px] font-bold text-white uppercase tracking-wider whitespace-nowrap -top-[18px] shadow-lg shadow-primary/30">
                            Most Popular
                        </div>
                    )}
                    <div className="mb-4">
                        <h3 className="text-xl font-bold tracking-tight">{pkg.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{pkg.description}</p>
                    </div>
                    <div className={`${count >= 5 ? 'text-3xl' : 'text-4xl'} font-extrabold mb-8 flex items-baseline gap-1`}>
                        <span className="text-xl font-bold">₱</span>
                        {pkg.price}
                        <span className="text-xs text-muted-foreground font-normal tracking-normal">{pkg.interval}</span>
                    </div>
                    <ul className="space-y-4 mb-10 flex-1">
                        {pkg.features?.map((feat, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm leading-tight text-foreground/80">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                {feat}
                            </li>
                        ))}
                    </ul>
                    <Link
                        href={pkg.button_link || "/register"}
                        className={`w-full h-12 flex items-center justify-center rounded-2xl text-sm font-bold transition-all active:scale-95 ${pkg.is_popular
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20'
                            : 'bg-muted/50 text-foreground hover:bg-muted border border-border/50'
                            }`}
                    >
                        {pkg.button_text}
                    </Link>
                </div>
            ))}
        </div>
    );
}
