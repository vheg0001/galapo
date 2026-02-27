import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Admin Dashboard",
    description: "GalaPo super admin dashboard.",
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            {/* Sidebar placeholder */}
            <aside className="hidden w-64 shrink-0 border-r border-border bg-primary text-primary-foreground lg:block">
                <div className="flex h-16 items-center border-b border-primary-foreground/10 px-6">
                    <span className="text-lg font-bold">Admin</span>
                </div>
                <nav className="space-y-1 p-4">
                    <span className="block rounded-md px-3 py-2 text-sm text-primary-foreground/70">
                        Dashboard
                    </span>
                    <span className="block rounded-md px-3 py-2 text-sm text-primary-foreground/70">
                        Businesses
                    </span>
                    <span className="block rounded-md px-3 py-2 text-sm text-primary-foreground/70">
                        Users
                    </span>
                    <span className="block rounded-md px-3 py-2 text-sm text-primary-foreground/70">
                        Categories
                    </span>
                    <span className="block rounded-md px-3 py-2 text-sm text-primary-foreground/70">
                        Reports
                    </span>
                    <span className="block rounded-md px-3 py-2 text-sm text-primary-foreground/70">
                        Settings
                    </span>
                </nav>
            </aside>

            {/* Main content */}
            <div className="flex flex-1 flex-col">
                <header className="flex h-16 items-center border-b border-border bg-background px-6">
                    <h1 className="text-lg font-semibold text-foreground">
                        Admin Dashboard
                    </h1>
                </header>
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
