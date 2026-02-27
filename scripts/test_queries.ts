import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { getCategoryListings } from "../lib/queries";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Simulating page.tsx logic...");

    // Get the category ID
    const { data: category } = await supabase.from("categories").select("*").eq("slug", "food-and-dining").single();
    if (!category) return console.log("Category not found");

    console.log("Testing getCategoryListings directly as used in page.tsx...");
    const { listings, total, error } = await getCategoryListings(supabase, {
        categoryId: category.id,
        featuredOnly: false,
        sort: "featured",
        page: 1,
    });

    console.log("Total:", total, "Listings returned:", listings?.length, "Error:", error);
}

check().catch(console.error);
