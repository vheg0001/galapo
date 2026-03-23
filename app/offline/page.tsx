"use client";

import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function OfflinePage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
            <div className="mx-auto max-w-md space-y-6">
                {/* Offline icon */}
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-muted-foreground"
                    >
                        <path d="M12.01 21.49 23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z" />
                        <line x1="1" x2="23" y1="1" y2="23" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    You&apos;re offline
                </h1>
                <p className="text-muted-foreground">
                    It looks like you&apos;ve lost your internet connection. Please check
                    your network and try again.
                </p>

                <div className="flex flex-col items-center gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="text-sm text-secondary underline-offset-4 hover:underline"
                    >
                        Go to {APP_NAME} Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
