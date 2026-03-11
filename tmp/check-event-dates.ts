
import { createAdminSupabaseClient } from "../lib/supabase";

async function check() {
    const admin = createAdminSupabaseClient();
    const { data: events, error } = await admin.from("events").select("title, event_date, is_active");
    if (error) {
        console.error("Error:", error);
        return;
    }
    console.log("Current time (ISO):", new Date().toISOString());
    console.log("Current time (Manila):", new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }));
    console.log("Events found:", events.length);
    events.forEach(e => {
        console.log(`- ${e.title}: ${e.event_date} (is_active: ${e.is_active})`);
    });
}

check();
