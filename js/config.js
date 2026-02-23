/**
 * Konfigurasi Terpusat - BASNOM HIPMI OTOMOTIF JABAR
 * Ganti nilai di bawah ini sesuai kredensial Anda
 */
const CONFIG = {
    // === Turso Database ===
    TURSO_URL: "https://otoinvinitation-cecepabuazhar.aws-ap-northeast-1.turso.io",
    TURSO_TOKEN: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzE4MDIwOTgsImlkIjoiYzlkYzM3NjYtOTNmYi00ZDcyLWFmNzktMzg5Y2Y4NWU5Yzc5IiwicmlkIjoiZjI5YmMyYmItOTNlMS00NGFiLWI2MjMtNDEzYzQzNTRkMzRiIn0.X6kNwDtYuHH1jjSUkFvG2z4fE3Bh9e2Yb_hZvdjcDF2VyHrtQeWMW5CpvUrCxZ-0mqg398ZvQV7pchTDUlpQDA", // << PASTE FULL TOKEN DI SINI

    // === WA Gateway ===
    WA_API_URL: "https://wa-proxy.GANTI-INI.workers.dev",  // << Ganti dengan URL Cloudflare Worker Anda
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

// Helper: Generate unique token (UUID v4-ish + timestamp suffix)
CONFIG.generateToken = () => {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
    return `${s4()}${s4()}-${s4()}-4${s4().slice(1)}-${s4()}-${s4()}${s4()}${Date.now().toString(36)}`;
};

// Helper: Build invitation URL
CONFIG.buildInvitationURL = (token) => {
    const base = (typeof location !== 'undefined')
        ? `${location.origin}${location.pathname.replace(/\/[^/]*$/, '')}`
        : '';
    return `${base}/invitation.html?token=${token}`;
};

// Helper: Build WA message (with livelier language + invitation link)
CONFIG.buildWAMessage = (nama, komunitas, status, inviteURL = '') => {
    const e = CONFIG.EVENT;
    if (status === "Hadir") {
        return (
`🎉 *Halo, ${nama}!*

Alhamdulillah, kami dengan senang hati mengonfirmasi pendaftaran Anda! 🙏

Anda resmi terdaftar sebagai *tamu undangan* acara:

✨ *${e.nama}*
🏢 ${e.organisasi}

📅 *Tanggal* : ${e.tanggal}
⏰ *Waktu*   : ${e.waktu}
📍 *Lokasi*  : ${e.lokasi}
👔 *Dresscode*: *${e.dresscode}*

🎟️ *Undangan Digital Anda:*
${inviteURL}

Simpan link di atas — tunjukkan kepada panitia saat hadir untuk proses check-in yang cepat & mudah. Jangan lupa datang tepat waktu ya! 😊

_Sampai jumpa di acara!_ 🚗✨

Salam hangat,
*${e.contact}*`
        );
    } else {
        return (
`😊 *Halo, ${nama}!*

Terima kasih sudah meluangkan waktu untuk merespons undangan kami. Kami sangat menghargainya! 🙏

Kami mencatat bahwa Anda *tidak dapat hadir* pada acara:

✨ *${e.nama}*
🏢 ${e.organisasi}
📅 ${e.tanggal} · ${e.waktu}
📍 ${e.lokasi}

Semoga di lain kesempatan kita bisa bertemu. Jika ada perubahan rencana, tidak ada salahnya hadir mendadak — kami selalu senang! 😄

Salam,
*${e.contact}*`
        );
    }
};

// Helper: Kirim WA melalui Cloudflare Worker proxy
// Worker menangani Basic Auth server-side, sehingga tidak ada CORS issue.
// Return: true jika HTTP 2xx, false jika gagal.
CONFIG.sendWA = async (phone, message) => {
    try {
        const res = await fetch(CONFIG.WA_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, message })
        });
        if (!res.ok) {
            const body = await res.text().catch(() => '');
            console.warn(`WA HTTP ${res.status}:`, body);
            return false;
        }
        return true;
    } catch (e) {
        console.warn('WA send error:', e);
        return false;
    }
};

// Helper: Turso pipeline fetch
CONFIG.tursoFetch = async (requests) => {
    // Guard: token belum diisi
    if (!CONFIG.TURSO_TOKEN || CONFIG.TURSO_TOKEN.endsWith('...')) {
        throw new Error('TOKEN_PLACEHOLDER');
    }
    // Guard: harus jalan dari HTTP, bukan file://
    if (location.protocol === 'file:') {
        throw new Error('FILE_PROTOCOL');
    }
    const res = await fetch(`${CONFIG.TURSO_URL}/v2/pipeline`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CONFIG.TURSO_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
    });
    if (!res.ok) {
        let errBody = '';
        try { errBody = await res.text(); } catch {}
        throw new Error(`HTTP ${res.status}: ${errBody.slice(0, 200)}`);
    }
    const json = await res.json();
    // Turso kadang return HTTP 200 tapi body berisi error (misal tabel tidak ada)
    for (const result of json.results ?? []) {
        if (result.type === 'error') {
            throw new Error(`DB_ERROR: ${result.error?.message ?? JSON.stringify(result.error)}`);
        }
    }
    return json;
};
