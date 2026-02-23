import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attendance } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    await db.delete(attendance).where(eq(attendance.id, numId));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  try {
    const body = await req.json();

    if (body.checkin_at !== undefined) {
      await db
        .update(attendance)
        .set({ checkin_at: body.checkin_at as string | null })
        .where(eq(attendance.id, numId));
    }

    if (body.wa_sent !== undefined) {
      await db
        .update(attendance)
        .set({ wa_sent: Number(body.wa_sent) })
        .where(eq(attendance.id, numId));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

