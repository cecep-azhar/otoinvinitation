/**
 * Konfigurasi Terpusat - BASNOM HIPMI OTOMOTIF JABAR
 * Ganti nilai di bawah ini sesuai kredensial Anda
 */
const CONFIG = {
    // === Turso Database ===
    TURSO_URL: "https://otoinvinitation-cecepabuazhar.aws-ap-northeast-1.turso.io",
    TURSO_TOKEN: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...", // << PASTE FULL TOKEN DI SINI

    // === WA Gateway ===
    WA_API_URL: "https://wa.fath.my.id/send/message",
    WA_USER: "cecep",
    WA_PASS: "126126",

    // === Admin ===
    ADMIN_PIN: "12345678",

    // === Info Acara ===
    EVENT: {
        nama: "Ceremonial, Talkshow & Buka Bersama",
        organisasi: "BASNOM HIPMI OTOMOTIF JAWA BARAT",
        tanggal: "7 Maret 2026",
        waktu: "14.00 WIB - Selesai",
        lokasi: "Thee Matic Mall Majalaya",
        dresscode: "Hitam Gold",
        contact: "Kabid Digital & Marketplace BPD HIPMI OTOMOTIF JAWA BARAT"
    }
};

// Helper: Build WA message
CONFIG.buildWAMessage = (nama, komunitas, status) => {
    const e = CONFIG.EVENT;
    const icon = status === "Hadir" ? "✅" : "❌";
    return `${icon} *Konfirmasi RSVP Diterima!*\n\nTerima kasih *${nama}* dari *${komunitas}* telah melakukan konfirmasi kehadiran *(${status})* untuk acara:\n\n🏆 *${e.nama}*\n🏢 ${e.organisasi}\n\n📅 Tanggal  : ${e.tanggal}\n⏰ Waktu    : ${e.waktu}\n📍 Lokasi   : ${e.lokasi}\n👔 Dresscode: *${e.dresscode}*\n\nKami tunggu kehadiran Anda!\n\nRegards,\n*${e.contact}*`;
};

// Helper: Turso pipeline fetch
CONFIG.tursoFetch = async (requests) => {
    const res = await fetch(`${CONFIG.TURSO_URL}/v2/pipeline`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CONFIG.TURSO_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
};
