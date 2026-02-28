"use client";

import { Facebook, Twitter, LinkIcon, Share2 } from "lucide-react";
import { useState, useEffect } from "react";

interface SocialShareButtonsProps {
    url: string;
    title: string;
}

export default function SocialShareButtons({ url, title }: SocialShareButtonsProps) {
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const shareLinks = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title, url });
            } catch {
                // User cancelled
            }
        }
    };

    const buttonClass =
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

    return (
        <div className="flex items-center gap-2">
            <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className={buttonClass} aria-label="Share on Facebook">
                <Facebook className="h-4 w-4" />
            </a>
            <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className={buttonClass} aria-label="Share on Twitter">
                <Twitter className="h-4 w-4" />
            </a>
            <button onClick={handleCopyLink} className={buttonClass} aria-label="Copy link">
                <LinkIcon className="h-4 w-4" />
            </button>
            {mounted && typeof navigator !== "undefined" && "share" in navigator && (
                <button onClick={handleNativeShare} className={buttonClass} aria-label="Share">
                    <Share2 className="h-4 w-4" />
                </button>
            )}
            {copied && (
                <span className="text-xs text-emerald-500 font-medium animate-in fade-in">Copied!</span>
            )}
        </div>
    );
}
