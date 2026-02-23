import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attendance } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateToken, buildInvitationURL, buildWAMessage } from "@/lib/event";
import { sendWA } from "@/lib/wa";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { nama, komunitas, whatsapp, status, alasan } = await req.json();

    // Validate
    if (!nama || !komunitas || !whatsapp || !status) {
      return NextResponse.json({ error: "Field wajib tidak boleh kosong" }, { status: 400 });
    }
    if (!/^628\d{7,13}$/.test(whatsapp)) {
      return NextResponse.json({ error: "Format nomor WhatsApp tidak valid" }, { status: 400 });
    }

    // Check duplicate
    const existing = await db.select({ id: attendance.id })
      .from(attendance)
      .where(eq(attendance.whatsapp, whatsapp))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: `Nomor WhatsApp ${whatsapp} sudah terdaftar` }, { status: 409 });
    }

    // Generate token
    const token = generateToken();

    // Insert to DB
    await db.insert(attendance).values({
      nama,
      komunitas,
      whatsapp,
      status,
      alasan: alasan || null,
      invite_token: token,
      wa_sent: 0,
    });

    // Build invitation URL (from origin header)
    const headersList = await headers();
    const origin = headersList.get("origin") ?? req.nextUrl.origin;
    const inviteURL = buildInvitationURL(origin, token);

    // Send WA (non-blocking – even if fails, RSVP is saved)
    let waSent = false;
    let waError: string | null = null;
    try {
      const msg = buildWAMessage(nama, komunitas, status, status === "Hadir" ? inviteURL : undefined);
      await sendWA(whatsapp, msg);
      waSent = true;
      // Update wa_sent flag
      await db.update(attendance).set({ wa_sent: 1 }).where(eq(attendance.invite_token, token));
    } catch (e) {
      waError = (e as Error).message;
      console.warn("WA send failed:", waError);
    }

    return NextResponse.json({
      success: true,
      token,
      inviteURL,
      waSent,
      waError,
    });
  } catch (err) {
    console.error("RSVP error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
