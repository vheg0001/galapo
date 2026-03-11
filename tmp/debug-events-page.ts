
import { createServerSupabaseClient } from "../lib/supabase";
import { fetchPublicEvents } from "../lib/event-helpers";

async function debug() {
    console.log("Starting debug...");
    try {
        const supabase = await createServerSupabaseClient();
        console.log("Supabase client created.");

        const result = await fetchPublicEvents(supabase, { period: "upcoming" });
        console.log("fetchPublicEvents successful.");
        console.log("Total events:", result.total);
        console.log("Events found:", result.data.length);

        if (result.data.length > 0) {
            console.log("First event slug:", result.data[0].slug);
        } else {
            console.log("WARNING: No events found matching upcoming filter.");
        }
    } catch (err) {
        console.error("DEBUG FAILED:", err);
    }
}

debug();
