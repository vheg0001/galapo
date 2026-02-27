import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

async function testConnection() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error("❌ Missing Supabase environment variables in .env.local");
        process.exit(1);
    }

    console.log("🚀 Testing Supabase connection...");
    console.log(`URL: ${supabaseUrl}`);

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
        .from("categories")
        .select("name")
        .limit(5);

    if (error) {
        console.error("❌ Connection failed!");
        console.error(error);
        process.exit(1);
    }

    console.log("✅ Connection successful!");
    console.log("Fetched sample categories:");
    data.forEach(cat => console.log(` - ${cat.name}`));
}

testConnection().catch(err => {
    console.error("💥 Unexpected error:");
    console.error(err);
    process.exit(1);
});
