import { NextResponse } from "next/server";
import { getServerSession, getServerProfile } from "@/lib/auth-helpers";

// ──────────────────────────────────────────────────────────
// GalaPo — Session Route Handler (Module 7.2)
// GET /api/auth/session
// ──────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            return NextResponse.json({ user: null });
        }

        const profile = await getServerProfile();

        return NextResponse.json({
            user: session.user,
            profile,
            session
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to fetch session." }, { status: 500 });
    }
}
