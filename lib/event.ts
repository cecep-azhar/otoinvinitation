// Semua EVENT_* pakai NEXT_PUBLIC_ agar terbaca di client components (browser)
// Fallback hardcoded tetap ada jika env tidak di-set
const e = {
  nama:       process.env.NEXT_PUBLIC_EVENT_NAMA        ?? "Ceremonial, Talkshow & Buka Bersama",
  organisasi: process.env.NEXT_PUBLIC_EVENT_ORGANISASI  ?? "BASNOM HIPMI OTOMOTIF JAWA BARAT",
  tanggal:    process.env.NEXT_PUBLIC_EVENT_TANGGAL     ?? "7 Maret 2026",
  waktu:      process.env.NEXT_PUBLIC_EVENT_WAKTU       ?? "14.00 WIB - Selesai",
  lokasi:     process.env.NEXT_PUBLIC_EVENT_LOKASI      ?? "Thee Matic Mall Majalaya",
  dresscode:  process.env.NEXT_PUBLIC_EVENT_DRESSCODE   ?? "Hitam Gold",
  contact:    process.env.NEXT_PUBLIC_EVENT_CONTACT     ?? "Kabid Digital & Marketplace BPD HIPMI OTOMOTIF JAWA BARAT",
  wa_intro:   process.env.NEXT_PUBLIC_EVENT_WA_INTRO    ?? "Hana — Asisten Virtual BPD HIPMI OTOMOTIF JAWA BARAT",
};

/** Event config – readable on both server & client */
export const EVENT = e;

/** Generate random unique token */
export function generateToken(): string {
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .slice(1);
  return `${s4()}${s4()}-${s4()}-4${s4().slice(1)}-${s4()}-${s4()}${s4()}${Date.now().toString(36)}`;
}

/** Build invitation URL from base URL + token */
export function buildInvitationURL(base: string, token: string): string {
  return `${base}/invitation?token=${token}`;
}

/** Build WA confirmation message (server-side only via /api/wa) */
export function buildWAMessage(
  nama: string,
  komunitas: string,
  status: string,
  inviteURL?: string
): string {
  if (status === "Hadir") {
    return `🎉 *Bismillah. Halo, ${nama}!*

${e.wa_intro}

Alhamdulillah, kami dengan senang hati mengonfirmasi pendaftaran Anda! 🙏

Anda resmi terdaftar sebagai *tamu undangan* acara:

✨ *${e.nama}*
🏢 ${e.organisasi}

📅 *Tanggal* : ${e.tanggal}
⏰ *Waktu*   : ${e.waktu}
📍 *Lokasi*  : ${e.lokasi}
👔 *Dresscode*: *${e.dresscode}*

🎟️ *Undangan Digital Anda:*
${inviteURL ?? ""}

Simpan link di atas — tunjukkan kepada panitia saat hadir untuk proses check-in yang cepat & mudah. Jangan lupa datang tepat waktu ya! 😊

_Sampai jumpa di acara!_ 🚗✨

Salam, ${e.wa_intro}
*${e.contact}*`;
  }

  return `😊 *Halo, ${nama}!*

${e.wa_intro}

Terima kasih sudah meluangkan waktu untuk merespons undangan kami. Kami sangat menghargainya! 🙏

Kami mencatat bahwa Anda *tidak dapat hadir* pada acara:

✨ *${e.nama}*
🏢 ${e.organisasi}
📅 ${e.tanggal} · ${e.waktu}
📍 ${e.lokasi}

Semoga di lain kesempatan kita bisa bertemu. Jika ada perubahan rencana, tidak ada salahnya hadir mendadak — kami selalu senang! 😄

Salam, ${e.wa_intro}
*${e.contact}*`;
}
