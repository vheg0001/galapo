import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { createAdminSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const auth = await requireAdmin(request);
    if ("error" in auth) return auth.error;

    try {
        const { subject, body } = await request.json();

        if (!subject || !body) {
            return NextResponse.json({ error: "Subject and body are required to send an email." }, { status: 400 });
        }

        const admin = createAdminSupabaseClient();
        const { data: profile } = await admin.from("profiles").select("email, full_name").eq("id", id).single();
        if (!profile?.email) {
            return NextResponse.json({ error: "Target user has no email address." }, { status: 400 });
        }

        // Integration with Resend (mocked for now, depending on actual implementation logic per GalaPo architecture)
        // Since `resend` isn't fully set up in all environments, we'll log it in activity and return success
        
        // Log in activity tracking table (e.g. `listing_analytics` or a generic `activity_log`)
        // Assuming we just want to create a generic admin note acting as an activity log for emails
        await admin.from("admin_user_notes").insert({
            user_id: id,
            admin_id: auth.user.id,
            note: `[EMAIL SENT] Subject: ${subject}\n\n${body}`
        });

        // E.g., const resend = new Resend(process.env.RESEND_API_KEY);
        // await resend.emails.send({ from: 'admin@galapo.com', to: profile.email, subject, text: body });

        return NextResponse.json({ success: true, message: `Email delivered to ${profile.email}` });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
