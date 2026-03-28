"use client";

import { useState } from "react";
import { SubscriptionStatsRow } from "@/components/admin/subscriptions/SubscriptionStatsRow";
import { SubscriptionsTable } from "@/components/admin/subscriptions/SubscriptionsTable";

export function SubscriptionsManagementPanel() {
    const [statsRefreshKey, setStatsRefreshKey] = useState(0);

    function handleSubscriptionsChanged() {
        setStatsRefreshKey((currentValue) => currentValue + 1);
    }

    return (
        <>
            <SubscriptionStatsRow refreshKey={statsRefreshKey} />

            <div className="mt-8">
                <SubscriptionsTable onDataChanged={handleSubscriptionsChanged} />
            </div>
        </>
    );
}
