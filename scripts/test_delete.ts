import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(supabaseUrl!, supabaseKey!);

async function check() {
    console.log("Checking if listing_field_values table exists...");
    const { data, error } = await admin
        .from("listing_field_values")
        .select("id", { count: "exact", head: true })
        .limit(1);

    if (error) {
        console.error("Error checking table:", error.message);
    } else {
        console.log("Table exists.");
    }
}

check();
