import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Business Dashboard",
    description: "Manage your business listing on GalaPo.",
};

export default function BusinessLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            {/* Sidebar placeholder — will be built out later */}
            <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar text-sidebar-foreground lg:block">
                <div className="flex h-16 items-center border-b border-sidebar-border px-6">
                    <span className="text-lg font-bold">Business</span>
                </div>
                <nav className="space-y-1 p-4">
                    <span className="block rounded-md px-3 py-2 text-sm text-sidebar-foreground/70">
                        Dashboard
                    </span>
                    <span className="block rounded-md px-3 py-2 text-sm text-sidebar-foreground/70">
                        Listings
                    </span>
                    <span className="block rounded-md px-3 py-2 text-sm text-sidebar-foreground/70">
                        Reviews
                    </span>
                    <span className="block rounded-md px-3 py-2 text-sm text-sidebar-foreground/70">
                        Analytics
                    </span>
                    <span className="block rounded-md px-3 py-2 text-sm text-sidebar-foreground/70">
                        Settings
                    </span>
                </nav>
            </aside>

            {/* Main content */}
            <div className="flex flex-1 flex-col">
                <header className="flex h-16 items-center border-b border-border bg-background px-6">
                    <h1 className="text-lg font-semibold text-foreground">
                        Business Dashboard
                    </h1>
                </header>
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
