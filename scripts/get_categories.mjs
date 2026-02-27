import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: cities } = await supabase.from("cities").select("slug");
    console.log("Cities:", cities);

    const { data: categories } = await supabase.from("categories").select("slug");
    console.log("Categories:", categories);

    const { data: barangays } = await supabase.from("barangays").select("slug");
    console.log("Barangays:", barangays);
}

check().catch(console.error);
