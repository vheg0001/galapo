import AdminPageHeader from "@/components/admin/shared/AdminPageHeader";
import { TopSearchStatsRow } from "@/components/admin/top-search/TopSearchStatsRow";
import { TopSearchCategoryView } from "@/components/admin/top-search/TopSearchCategoryView";

export const dynamic = 'force-dynamic';

export const metadata = {
    title: "Top Search Placements - GalaPo Admin",
};

export default async function AdminTopSearchPage() {
    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Top Search Placements"
                description="Manage the 3 top search spots per category. Placements bypass standard ranking to appear at the top."
            />

            <TopSearchStatsRow />

            <div className="mt-8">
                <TopSearchCategoryView />
            </div>
        </div>
    );
}
