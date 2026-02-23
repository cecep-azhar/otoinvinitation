import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Server-side: bisa baca EVENT_* (tanpa NEXT_PUBLIC_)
// Fallback ke hardcoded jika ENV tidak ada
export async function GET() {
  return NextResponse.json({
    nama:       process.env.EVENT_NAMA        ?? process.env.NEXT_PUBLIC_EVENT_NAMA        ?? "Ceremonial, Talkshow & Buka Bersama",
    organisasi: process.env.EVENT_ORGANISASI  ?? process.env.NEXT_PUBLIC_EVENT_ORGANISASI  ?? "BASNOM HIPMI OTOMOTIF JAWA BARAT",
    tanggal:    process.env.EVENT_TANGGAL     ?? process.env.NEXT_PUBLIC_EVENT_TANGGAL     ?? "7 Maret 2026",
    waktu:      process.env.EVENT_WAKTU       ?? process.env.NEXT_PUBLIC_EVENT_WAKTU       ?? "14.00 WIB - Selesai",
    lokasi:     process.env.EVENT_LOKASI      ?? process.env.NEXT_PUBLIC_EVENT_LOKASI      ?? "Thee Matic Mall Majalaya",
    dresscode:  process.env.EVENT_DRESSCODE   ?? process.env.NEXT_PUBLIC_EVENT_DRESSCODE   ?? "Hitam Gold",
    contact:    process.env.EVENT_CONTACT     ?? process.env.NEXT_PUBLIC_EVENT_CONTACT     ?? "Kabid Digital & Marketplace BPD HIPMI OTOMOTIF JAWA BARAT",
    wa_intro:   process.env.EVENT_WA_INTRO    ?? process.env.NEXT_PUBLIC_EVENT_WA_INTRO    ?? "Hana — Asisten Virtual BPD HIPMI OTOMOTIF JAWA BARAT",
  });
}
