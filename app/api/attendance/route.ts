import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attendance } from "@/lib/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(attendance)
      .orderBy(sql`${attendance.id} DESC`);

    return NextResponse.json({ data: rows });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
