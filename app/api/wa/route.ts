import { NextRequest, NextResponse } from "next/server";
import { sendWA } from "@/lib/wa";
import { db } from "@/lib/db";
import { attendance } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { buildWAMessage, buildInvitationURL } from "@/lib/event";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { id, whatsapp, nama, komunitas, status, invite_token } = await req.json();

    if (!whatsapp || !nama || !status) {
      return NextResponse.json({ error: "Field wajib kurang" }, { status: 400 });
    }

    const headersList = await headers();
    const origin = headersList.get("origin") ?? req.nextUrl.origin;
    const inviteURL = invite_token ? buildInvitationURL(origin, invite_token) : "";

    const msg = buildWAMessage(
      nama,
      komunitas ?? "",
      status,
      status === "Hadir" && inviteURL ? inviteURL : undefined
    );

    await sendWA(whatsapp, msg);

    // Update wa_sent flag if id provided
    if (id) {
      await db
        .update(attendance)
        .set({ wa_sent: 1 })
        .where(eq(attendance.id, Number(id)));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
