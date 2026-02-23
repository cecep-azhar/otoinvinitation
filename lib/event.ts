export const EVENT = {
  nama: "Ceremonial, Talkshow & Buka Bersama",
  organisasi: "BASNOM HIPMI OTOMOTIF JAWA BARAT",
  tanggal: "7 Maret 2026",
  waktu: "14.00 WIB - Selesai",
  lokasi: "Thee Matic Mall Majalaya",
  dresscode: "Hitam Gold",
  contact: "Kabid Digital & Marketplace BPD HIPMI OTOMOTIF JAWA BARAT",
} as const;

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

/** Build WA confirmation message */
export function buildWAMessage(
  nama: string,
  komunitas: string,
  status: string,
  inviteURL?: string
): string {
  const e = EVENT;

  if (status === "Hadir") {
    return `🎉 *Halo, ${nama}!*

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

Salam hangat,
*${e.contact}*`;
  }

  return `😊 *Halo, ${nama}!*

Terima kasih sudah meluangkan waktu untuk merespons undangan kami. Kami sangat menghargainya! 🙏

Kami mencatat bahwa Anda *tidak dapat hadir* pada acara:

✨ *${e.nama}*
🏢 ${e.organisasi}
📅 ${e.tanggal} · ${e.waktu}
📍 ${e.lokasi}

Semoga di lain kesempatan kita bisa bertemu. Jika ada perubahan rencana, tidak ada salahnya hadir mendadak — kami selalu senang! 😄

Salam,
*${e.contact}*`;
}
