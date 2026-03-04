import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('c:/Users/Vawn Harvey/Desktop/galapo/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // using service role to bypass RLS for debugging
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDeletable() {
    // 1. Find a draft listing that we want to test deleting
    const { data: listings, error: fetchError } = await supabase
        .from('listings')
        .select('id, business_name, status, is_active, owner_id')
        .eq('status', 'draft')
        .limit(1);

    if (fetchError || !listings || listings.length === 0) {
        console.error("Could not find a draft listing to test:", fetchError);
        return;
    }

    const targetListings = listings[0];
    console.log("Found draft listing:", targetListings);

    // 2. Simulate the exact update performed by the DELETE route
    const { data: updatedData, error: updateError } = await supabase
        .from('listings')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', targetListings.id)
        .eq('owner_id', targetListings.owner_id)
        .select();

    if (updateError) {
        console.error("Simulated DELETE (update is_active) failed:", updateError);

        // Let's try to figure out WHY it failed by checking constraints or triggers
        const { data: constraintChecks, error: constraintError } = await supabase.rpc('get_listing_constraints', { listing_id: targetListings.id });
        if (!constraintError) console.log("Constraint check:", constraintChecks)
    } else {
        console.log("Simulated DELETE succeeded:", updatedData);

        // 3. Restore it back to active so we don't pollute the dev db
        await supabase
            .from('listings')
            .update({ is_active: true })
            .eq('id', targetListings.id);
        console.log("Restored listing to active=true");
    }
}

checkDeletable();
