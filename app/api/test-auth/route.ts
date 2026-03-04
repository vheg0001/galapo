import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-helpers";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = await createServerSupabaseClient();

        // Let's check what auth user we have in the DB request
        const { data: dbUser } = await supabase.auth.getUser();

        return NextResponse.json({
            serverSessionUser: session.user.id,
            supabaseAuthUser: dbUser?.user?.id || null
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
