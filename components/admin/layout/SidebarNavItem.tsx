"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface SidebarNavItemProps {
    href: string;
    label: string;
    icon: LucideIcon;
    badge?: number;
    collapsed?: boolean;
}

export default function SidebarNavItem({ href, label, icon: Icon, badge, collapsed }: SidebarNavItemProps) {
    const pathname = usePathname();
    const isActive = pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href));

    return (
        <Link
            href={href}
            title={collapsed ? label : undefined}
            className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150",
                isActive
                    ? "border-l-2 border-[#FF6B35] bg-white/10 pl-[10px] font-semibold text-white"
                    : "border-l-2 border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200",
                collapsed && "justify-center px-2"
            )}
        >
            <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#FF6B35]" : "text-gray-400 group-hover:text-gray-200")} />
            {!collapsed && (
                <>
                    <span className="flex-1 truncate">{label}</span>
                    {badge !== undefined && badge > 0 && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF6B35] px-1.5 text-[10px] font-bold text-white">
                            {badge > 99 ? "99+" : badge}
                        </span>
                    )}
                </>
            )}
        </Link>
    );
}
