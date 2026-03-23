"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarNavGroupProps {
    label: string;
    emoji: string;
    children: React.ReactNode;
    collapsed?: boolean;
}

export default function SidebarNavGroup({ label, emoji, children, collapsed }: SidebarNavGroupProps) {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="mt-2 space-y-0.5">
            {!collapsed && (
                <button
                    type="button"
                    onClick={() => setExpanded((value) => !value)}
                    className="mb-1 flex w-full items-center justify-between rounded-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-500 transition hover:bg-white/5 hover:text-gray-300"
                    aria-expanded={expanded}
                    aria-controls={`sidebar-group-${label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                    <span>{emoji} {label}</span>
                    <ChevronDown className={cn("h-3 w-3 transition-transform", expanded ? "rotate-0" : "-rotate-90")} />
                </button>
            )}
            {collapsed && (
                <div className="my-2 h-px w-full bg-white/10" />
            )}
            {(collapsed || expanded) && (
                <div id={`sidebar-group-${label.toLowerCase().replace(/\s+/g, "-")}`}>
                    {children}
                </div>
            )}
        </div>
    );
}
