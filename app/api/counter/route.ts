import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attendance } from "@/lib/schema";
import { sql, count } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [row] = await db
      .select({
        total: count(),
        hadir: sql<number>`SUM(CASE WHEN ${attendance.status} = 'Hadir' THEN 1 ELSE 0 END)`,
      })
      .from(attendance);

    return NextResponse.json({
      total: row?.total ?? 0,
      hadir: row?.hadir ?? 0,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
