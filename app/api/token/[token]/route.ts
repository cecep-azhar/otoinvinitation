import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attendance } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  try {
    const rows = await db
      .select()
      .from(attendance)
      .where(eq(attendance.invite_token, token))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Token tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ data: rows[0] });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  // Mark check-in by token
  const { token } = await params;
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  try {
    const rows = await db
      .select({ id: attendance.id, checkin_at: attendance.checkin_at, status: attendance.status })
      .from(attendance)
      .where(eq(attendance.invite_token, token))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Token tidak ditemukan" }, { status: 404 });
    }

    if (rows[0].checkin_at) {
      return NextResponse.json({ alreadyCheckin: true, data: rows[0] });
    }

    const now = new Date().toISOString();
    await db
      .update(attendance)
      .set({ checkin_at: now })
      .where(eq(attendance.invite_token, token));

    return NextResponse.json({ success: true, checkin_at: now });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
