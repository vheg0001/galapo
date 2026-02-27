import { createServerSupabaseClient } from "@/lib/supabase";

export default async function TestDbPage() {
    const supabase = await createServerSupabaseClient();

    // Fetch categories to test connection
    const { data: categories, error } = await supabase
        .from("categories")
        .select("id, name, icon")
        .order("sort_order", { ascending: true })
        .limit(10);

    if (error) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold text-red-600">Database Connection Failed</h1>
                <pre className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-sm overflow-auto">
                    {JSON.stringify(error, null, 2)}
                </pre>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Database Connection Successful</h1>
            </div>

            <p className="text-slate-600 dark:text-slate-400 mb-8">
                Fetched {categories?.length || 0} categories from the live Supabase database.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories?.map((category) => (
                    <div
                        key={category.id}
                        className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
                    >
                        <span className="text-3xl">{category.icon || "📁"}</span>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">{category.name}</h3>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">{category.id.slice(0, 8)}...</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <h2 className="text-sm font-bold text-blue-800 dark:text-blue-300 uppercase tracking-widest mb-2">Next Steps</h2>
                <p className="text-blue-700 dark:text-blue-400 text-sm">
                    Once you've verified the data is loading, you can safely delete this page at <code>app/test-db/page.tsx</code>.
                </p>
            </div>
        </div>
    );
}
