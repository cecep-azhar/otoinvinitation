import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attendance } from "@/lib/schema";
import { sql, eq } from "drizzle-orm";
import { generateToken } from "@/lib/event";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(attendance)
      .orderBy(sql`${attendance.id} DESC`);

    // Fix old data that don't have token
    let hasNull = false;
    for (const r of rows) {
      if (!r.invite_token) {
        r.invite_token = generateToken();
        await db.update(attendance).set({ invite_token: r.invite_token }).where(eq(attendance.id, r.id));
        hasNull = true;
      }
    }

    return NextResponse.json({ data: rows });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
