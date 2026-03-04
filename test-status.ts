import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    // get latest listings
    const { data: listings, error } = await supabase.from("listings").select("id, business_name, status, created_at").order("created_at", { ascending: false }).limit(5);
    if (error) {
        console.error("Error fetching listing:", error);
        return;
    }

    console.log("Latest listings:", JSON.stringify(listings, null, 2));
}

main();
